import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const maxDuration = 120;
import { saveUpload, updateMeta, type StoredManuscript } from "@/lib/storage";
import { getSignedDownloadUrl } from "@/lib/r2Storage";
import { getGutterInches } from "@/lib/kdpConfig";
import { enrichCheckerReport, cleanFilenameForDisplay } from "@/lib/kdpReportEnhance";
import { supabase } from "@/lib/supabase";
import { findKdpTrim, trimBoxSizeInches } from "@/lib/kdpPdfInspect";
import { CHECKER_MAX_UPLOAD_MB } from "@/lib/checkerUploadLimits";

const PREFLIGHT_POLL_MS = 2000;
const PREFLIGHT_MAX_WAIT_MS = 55000;

async function triggerLocalAnnotation(downloadId: string, origin: string): Promise<void> {
  const base = origin.replace(/\/$/, "");
  const res = await fetch(`${base}/api/annotate-local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ downloadId }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`annotate-local failed (${res.status}) ${body}`.trim());
  }
}

/** Preflight API report shape (GET /report/{job_id}). */
interface PreflightReport {
  status: string;
  readiness_score?: number;
  approval_likelihood?: number;
  creation_tool?: string;
  score_grade?: { grade: string; label: string; description: string };
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

function buildBasicReport(doc: PDFDocument, buffer: Buffer) {
  const pageCount = doc.getPageCount();
  const firstPage = doc.getPage(0);
  const { widthIn, heightIn } = trimBoxSizeInches(firstPage);
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
    if (isA4) {
      recommendations.push(
        "Your file is A4 size (8.27×11.69). KDP does not accept A4. To fix: open your manuscript in your design tool (Word, Canva, InDesign) and change the page size to a KDP standard trim. Most common choices: 6×9 for novels and non-fiction, 5×8 for shorter books, 8.5×11 for workbooks and journals. Re-export as PDF at the new size and re-upload here."
      );
    } else {
      recommendations.push("Re-export your file with a KDP trim size: 5×8, 5.5×8.5, 6×9, 8.5×11, etc. See KDP help for full list.");
    }
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
    const MAX_MB = CHECKER_MAX_UPLOAD_MB;
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
    const { widthIn, heightIn } = trimBoxSizeInches(firstPage);
    const kdpTrim = findKdpTrim(widthIn, heightIn);

    const preflightUrl = process.env.KDP_PREFLIGHT_API_URL;
    const fileNameScanned = f.name || "document.pdf";
    let report: ReturnType<typeof buildBasicReport>;
    let preflightJobId: string | null = null;
    let preflightReport: PreflightReport | null = null;
    let engineReadinessScore: number | undefined;
    let engineApprovalLikelihood: number | undefined;
    let engineCreationTool = "unknown";
    if (preflightUrl?.trim()) {
      const preflight = await runPreflightCheck(preflightUrl, buffer, fileNameScanned);
      if (preflight) {
        report = buildReportFromPreflight(preflight.report, buffer, widthIn, heightIn, kdpTrim);
        preflightJobId = preflight.job_id;
        preflightReport = preflight.report;
        engineReadinessScore = typeof preflight.report.readiness_score === "number" && preflight.report.readiness_score > 0 ? preflight.report.readiness_score : undefined;
        engineApprovalLikelihood = typeof preflight.report.approval_likelihood === "number" && preflight.report.approval_likelihood > 0 ? preflight.report.approval_likelihood : undefined;
        engineCreationTool = preflight.report.creation_tool ?? "unknown";
      } else {
        report = buildBasicReport(doc, buffer);
      }
    } else {
      report = buildBasicReport(doc, buffer);
    }

    const enrichedReport = enrichCheckerReport(
      report,
      fileNameScanned,
      preflightReport ?? undefined,
      engineReadinessScore,
      engineApprovalLikelihood,
      engineCreationTool,
    );
    const stored = await saveUpload(buffer, fileNameScanned, "application/pdf");
    await updateMeta(stored.id, { processingReport: enrichedReport as StoredManuscript["processingReport"] });

    // Store public verification summary
    try {
      const issuesCount = enrichedReport.issuesEnriched?.length ?? report.issues.length;

      // Derive per-check booleans for the social share card
      const allPreflightIssues = [
        ...(preflightReport?.errors ?? []),
        ...(preflightReport?.warnings ?? []),
      ];
      const hasIssueMatching = (terms: string[]) =>
        allPreflightIssues.some((i) => {
          const hay = `${i.rule_id ?? ""} ${i.message ?? ""}`.toLowerCase();
          return terms.some((t) => hay.includes(t));
        });

      const trimOk: boolean = !!enrichedReport.trimMatchKDP;
      const marginsOk: boolean = !hasIssueMatching(["margin", "safe zone", "safe_zone", "gutter"]);
      const bleedOk: boolean = !hasIssueMatching(["bleed"]);
      const fontsOk: boolean = !hasIssueMatching(["font", "embed", "subsett"]);

      await supabase.from("verification_results").upsert(
        {
          verification_id: stored.id,
          filename_clean: cleanFilenameForDisplay(enrichedReport.fileNameScanned),
          readiness_score: enrichedReport.readinessScore100,
          kdp_ready: enrichedReport.kdpReady,
          scan_date: enrichedReport.scanDate,
          issues_count: issuesCount,
          trim_ok: trimOk,
          margins_ok: marginsOk,
          bleed_ok: bleedOk,
          fonts_ok: fontsOk,
        },
        { onConflict: "verification_id" }
      );
    } catch (e) {
      console.error("[kdp-pdf-check] verification_results upsert failed:", e);
    }

    try {
      const engineBaseUrl = preflightUrl?.trim() ? preflightUrl.replace(/\/$/, "") : null;
      await updateMeta(stored.id, {
        annotatedPdfStatus: "processing",
        ...(engineBaseUrl && preflightJobId
          ? { annotatedPdfUrl: `${engineBaseUrl}/file/${encodeURIComponent(preflightJobId)}/annotated` }
          : {}),
      });
      await triggerLocalAnnotation(stored.id, request.nextUrl.origin);
    } catch (e) {
      console.error("[kdp-pdf-check] annotate-local trigger failed:", e);
      await updateMeta(stored.id, { annotatedPdfStatus: "error" }).catch(() => {});
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
