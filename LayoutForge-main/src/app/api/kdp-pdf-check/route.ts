import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { saveUpload, updateMeta, type StoredManuscript } from "@/lib/storage";
import { TRIM_SIZES, getGutterInches } from "@/lib/kdpConfig";

const PT_PER_INCH = 72;
const TOLERANCE_INCH = 0.05; // allow 0.05" variance

function inchesFromPt(pt: number): number {
  return Math.round((pt / PT_PER_INCH) * 100) / 100;
}

function findKdpTrim(widthIn: number, heightIn: number): { id: string; name: string } | null {
  for (const t of TRIM_SIZES) {
    const wOk = Math.abs(widthIn - t.widthInches) <= TOLERANCE_INCH;
    const hOk = Math.abs(heightIn - t.heightInches) <= TOLERANCE_INCH;
    if (wOk && hOk) return { id: t.id, name: t.name };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData().catch(() => null);
    if (!formData) return NextResponse.json({ error: "Invalid request", message: "Could not read upload." }, { status: 400 });
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) return NextResponse.json({ error: "No file", message: "Send a file with field name file." }, { status: 400 });
    const f = file as File;
    const name = (f.name || "").toLowerCase();
    if (!name.endsWith(".pdf") && f.type !== "application/pdf") {
      return NextResponse.json({ error: "Unsupported format", message: "This tool accepts PDF files only." }, { status: 400 });
    }
    const buffer = Buffer.from(await f.arrayBuffer());
    const MAX_MB = 50;
    if (buffer.length > MAX_MB * 1024 * 1024) {
      return NextResponse.json({ error: "File too large", message: `File must be smaller than ${MAX_MB}MB.` }, { status: 400 });
    }

    let doc;
    try {
      doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    } catch (e) {
      console.error("[kdp-pdf-check] PDF load failed:", e);
      return NextResponse.json({ error: "Invalid PDF", message: "Could not read PDF. File may be corrupted or password-protected." }, { status: 400 });
    }

    const pageCount = doc.getPageCount();
    const firstPage = doc.getPage(0);
    const { width: wPt, height: hPt } = firstPage.getSize();
    const widthIn = inchesFromPt(wPt);
    const heightIn = inchesFromPt(hPt);
    const kdpTrim = findKdpTrim(widthIn, heightIn);

    const issues: string[] = [];
    const recommendations: string[] = [];

    if (pageCount < 24) issues.push(`Page count (${pageCount}) is below KDP minimum of 24.`);
    else if (pageCount > 828) issues.push(`Page count (${pageCount}) exceeds KDP maximum of 828.`);
    if (!kdpTrim) {
      issues.push(`Page size ${widthIn}" × ${heightIn}" is not a standard KDP trim size.`);
      recommendations.push("Re-export your file with a KDP trim size: 5×8, 5.5×8.5, 6×9, etc. See KDP help for full list.");
    } else {
      recommendations.push(`Trim size matches KDP: ${kdpTrim.name}.`);
    }
    if (buffer.length > 650 * 1024 * 1024) {
      issues.push("File size exceeds KDP limit (650 MB).");
    }
    recommendations.push("If you have full-bleed art (images to the edge), ensure 0.125\" bleed in your export. We can't detect bleed from the PDF.");

    const recommendedGutterInches = getGutterInches(pageCount);
    const report = {
      outputType: "checker" as const,
      chaptersDetected: 0,
      issues,
      fontUsed: "",
      trimSize: kdpTrim ? kdpTrim.id : `${widthIn}x${heightIn}`,
      pageCount,
      trimDetected: `${widthIn}" × ${heightIn}"`,
      trimMatchKDP: !!kdpTrim,
      kdpTrimName: kdpTrim?.name ?? null,
      recommendations,
      fileSizeMB: Math.round((buffer.length / (1024 * 1024)) * 100) / 100,
      recommendedGutterInches,
    };

    const stored = await saveUpload(buffer, f.name || "document.pdf", "application/pdf");
    await updateMeta(stored.id, { processingReport: report as StoredManuscript["processingReport"] });

    return NextResponse.json({ success: true, id: stored.id, report: { pageCount: report.pageCount, trimDetected: report.trimDetected, trimMatchKDP: report.trimMatchKDP, issuesCount: issues.length } });
  } catch (e) {
    console.error("[kdp-pdf-check]", e);
    const message = e instanceof Error ? e.message : "Check failed.";
    return NextResponse.json({ error: "Internal error", message }, { status: 500 });
  }
}
