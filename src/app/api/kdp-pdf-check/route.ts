import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const maxDuration = 60;
import { saveUpload, updateMeta, type StoredManuscript } from "@/lib/storage";
import { getSignedDownloadUrl } from "@/lib/r2Storage";
import { TRIM_SIZES, getGutterInches } from "@/lib/kdpConfig";
import { enrichCheckerReport, cleanFilenameForDisplay } from "@/lib/kdpReportEnhance";
import { supabase } from "@/lib/supabase";

const PT_PER_INCH = 72;
const TOLERANCE_INCH = 0.05; // allow 0.05" variance
const PREFLIGHT_POLL_MS = 2000;
const PREFLIGHT_MAX_WAIT_MS = 55000;

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

/** Preflight API report shape (GET /report/{job_id}). */
interface PreflightReport {
  status: string;
  errors: Array<{ page: number; rule_id: string; severity: string; message: string; bbox?: number[] | null }>;
  warnings: Array<{ page: number; rule_id: string; severity: string; message: string; bbox?: number[] | null }>;
  summary: { total_pages: number; error_count: number; warning_count: number; rules_checked: number };
  page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
}

async function runPreflightCheck(
  baseUrl: string,
  buffer: Buffer,
  fileName: string
): Promise<{ report: PreflightReport; job_id: string } | null> {
  const url = baseUrl.replace(/\/$/, "");
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "application/pdf" }), fileName || "document.pdf");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  let res: Response;
  try {
    res = await fetch(`${url}/upload`, { method: "POST", body: form, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) return null;
  const { job_id } = (await res.json()) as { job_id: string };
  const deadline = Date.now() + PREFLIGHT_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, PREFLIGHT_POLL_MS));
    res = await fetch(`${url}/status/${job_id}`);
    if (!res.ok) continue;
    const statusData = (await res.json()) as { status: string; report?: PreflightReport };
    if (statusData.status === "completed" && statusData.report) return { report: statusData.report, job_id };
    if (statusData.status === "failed") return null;
  }
  return null;
}

function buildReportFromPreflight(
  preflight: PreflightReport,
  buffer: Buffer,
  widthIn: number,
  heightIn: number,
  kdpTrim: { id: string; name: string } | null
) {
  const issues = [
    ...preflight.errors.map((e) => `[p.${e.page}] ${e.message}`),
    ...preflight.warnings.map((w) => `[p.${w.page}] ${w.message}`),
  ];
  const recommendations =
    preflight.status === "PASS"
      ? ["Full KDP preflight (26 rules) passed. No errors found."]
      : ["Fix the issues above before uploading to KDP."];
  if (kdpTrim) recommendations.push(`Trim size: ${kdpTrim.name}.`);
  const page_issues = preflight.page_issues ?? [
    ...preflight.errors.map((e) => ({ page: e.page, rule_id: e.rule_id, severity: e.severity, message: e.message, bbox: e.bbox ?? null })),
    ...preflight.warnings.map((w) => ({ page: w.page, rule_id: w.rule_id, severity: w.severity, message: w.message, bbox: w.bbox ?? null })),
  ];
  return {
    outputType: "checker" as const,
    chaptersDetected: 0,
    issues,
    fontUsed: "",
    trimSize: kdpTrim ? kdpTrim.id : `${widthIn}x${heightIn}`,
    pageCount: preflight.summary.total_pages,
    trimDetected: `${widthIn}" × ${heightIn}"`,
    trimMatchKDP: !!kdpTrim,
    kdpTrimName: kdpTrim?.name ?? null,
    recommendations,
    fileSizeMB: Math.round((buffer.length / (1024 * 1024)) * 100) / 100,
    recommendedGutterInches: getGutterInches(preflight.summary.total_pages),
    page_issues,
    hasPdfPreview: true,
  };
}

function buildBasicReport(
  doc: { getPageCount: () => number; getPage: (i: number) => { getSize: () => { width: number; height: number } } },
  buffer: Buffer
) {
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
    const isA4 =
      (Math.abs(widthIn - 8.27) <= 0.1 && Math.abs(heightIn - 11.69) <= 0.1) ||
      (Math.abs(widthIn - 11.69) <= 0.1 && Math.abs(heightIn - 8.27) <= 0.1);
    if (isA4) {
      issues.push("This appears to be A4 size. KDP does not accept A4. Use 8.5×11 (US Letter) or another KDP trim size instead.");
    } else {
      issues.push(`Page size ${widthIn}" × ${heightIn}" is not a standard KDP trim size.`);
    }
    recommendations.push("Re-export your file with a KDP trim size: 5×8, 5.5×8.5, 6×9, 8.5×11, etc. See KDP help for full list.");
  } else {
    recommendations.push(`Trim size matches KDP: ${kdpTrim.name}.`);
  }
  if (buffer.length > 650 * 1024 * 1024) issues.push("File size exceeds KDP limit (650 MB).");
  return {
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
    recommendedGutterInches: getGutterInches(pageCount),
  };
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
    const SIZE_10_MB = 10 * 1024 * 1024;
    if (buffer.length > SIZE_10_MB) {
      return NextResponse.json({
        error: "File too large",
        message: "This file is too large to scan. Please compress it first using our free PDF Compressor, then try again.",
      }, { status: 400 });
    }
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

    const firstPage = doc.getPage(0);
    const { width: wPt, height: hPt } = firstPage.getSize();
    const widthIn = inchesFromPt(wPt);
    const heightIn = inchesFromPt(hPt);
    const kdpTrim = findKdpTrim(widthIn, heightIn);

    const preflightUrl = process.env.KDP_PREFLIGHT_API_URL;
    const fileNameScanned = f.name || "document.pdf";
    let report: ReturnType<typeof buildBasicReport>;
    let preflightJobId: string | null = null;
    let preflightReport: PreflightReport | null = null;
    if (preflightUrl?.trim()) {
      const preflight = await runPreflightCheck(preflightUrl, buffer, fileNameScanned);
      if (preflight) {
        report = buildReportFromPreflight(preflight.report, buffer, widthIn, heightIn, kdpTrim);
        preflightJobId = preflight.job_id;
        preflightReport = preflight.report;
      } else {
        report = buildBasicReport(doc, buffer);
      }
    } else {
      report = buildBasicReport(doc, buffer);
    }

    const enrichedReport = enrichCheckerReport(report, fileNameScanned, preflightReport ?? undefined);
    const stored = await saveUpload(buffer, fileNameScanned, "application/pdf");
    await updateMeta(stored.id, { processingReport: enrichedReport as StoredManuscript["processingReport"] });

    // Store public verification summary
    try {
      const issuesCount = enrichedReport.issuesEnriched?.length ?? report.issues.length;
      await supabase.from("verification_results").upsert(
        {
          verification_id: stored.id,
          filename_clean: cleanFilenameForDisplay(enrichedReport.fileNameScanned),
          readiness_score: enrichedReport.readinessScore100,
          kdp_ready: enrichedReport.kdpReady,
          scan_date: enrichedReport.scanDate,
          issues_count: issuesCount,
        },
        { onConflict: "verification_id" }
      );
    } catch (e) {
      console.error("[kdp-pdf-check] verification_results upsert failed:", e);
    }

    // Trigger annotation — for preflight path use existing job_id,
    // for local path upload to preflight engine just to get annotations
    const engineBaseUrl = preflightUrl?.trim() ? preflightUrl.replace(/\/$/, "") : null;
    let annotateJobId: string | null = preflightJobId ?? null;

    if (engineBaseUrl && !annotateJobId) {
      try {
        try {
          await Promise.race([
            fetch(`${engineBaseUrl}/health`, { method: "GET" }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("ping timeout")), 10000))
          ]);
        } catch {
          // ping failed or timed out — engine may still be waking, continue anyway
        }
        const form = new FormData();
        form.append("file", new Blob([buffer], { type: "application/pdf" }), f.name || "document.pdf");
        const uploadRes = await fetch(`${engineBaseUrl}/upload`, {
          method: "POST",
          body: form,
          signal: AbortSignal.timeout(25000)
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json() as { job_id?: string };
          annotateJobId = uploadData.job_id ?? null;
        }
      } catch (e) {
        console.error("[kdp-pdf-check] annotation upload failed:", e);
      }
    }

    if (engineBaseUrl && annotateJobId) {
      fetch(`${engineBaseUrl}/annotate/${annotateJobId}`, { method: "POST" }).catch((e) => console.error("[annotate trigger]", e));
      await updateMeta(stored.id, {
        annotatedPdfUrl: `${engineBaseUrl}/file/${annotateJobId}/annotated`,
        annotatedPdfStatus: "processing",
      });
    }

    if (process.env.USE_R2 === "true" && stored.storedPath) {
      const filename = stored.storedPath.split("/").pop();
      if (filename) {
        try {
          const reportDownloadUrl = await getSignedDownloadUrl(stored.id, filename);
          await updateMeta(stored.id, { reportDownloadUrl });
        } catch {
          // non-fatal
        }
      }
    }

    return NextResponse.json({
      success: true,
      id: stored.id,
      report: {
        pageCount: report.pageCount,
        trimDetected: report.trimDetected,
        trimMatchKDP: report.trimMatchKDP,
        issuesCount: report.issues.length,
      },
    });
  } catch (e) {
    console.error("[kdp-pdf-check]", e);
    const message = e instanceof Error ? e.message : "Check failed.";
    return NextResponse.json({ error: "Internal error", message }, { status: 500 });
  }
}
