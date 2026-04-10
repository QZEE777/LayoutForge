/**
 * Core logic: run KDP preflight for an R2 PDF and save the checker result.
 * Used by the async worker; not used by the API route (route only enqueues).
 * Requires: getFileByKey, saveUpload, updateMeta, supabase, enrichCheckerReport, getGutterInches.
 */
import { PDFDocument } from "pdf-lib";
import { saveUpload, updateMeta, type StoredManuscript } from "./storage";
import { getSignedDownloadUrl, getFileByKey, getSignedUrlForKey } from "./r2Storage";
import { getGutterInches } from "./kdpConfig";
import { inspectPdfBufferForChecker } from "./kdpPdfInspect";
import { supabase } from "./supabase";
import { enrichCheckerReport } from "./kdpReportEnhance";

const DEFAULT_PREFLIGHT_BASE_URL = "https://kdp-preflight-engine-production.up.railway.app";

export interface PreflightReport {
  status: string;
  readiness_score?: number;
  approval_likelihood?: number;
  errors: Array<{ page: number; rule_id: string; severity: string; message: string; bbox?: number[] | null }>;
  warnings: Array<{ page: number; rule_id: string; severity: string; message: string; bbox?: number[] | null }>;
  summary: { total_pages: number; error_count: number; warning_count: number; rules_checked: number };
  page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
}

interface CheckerReport {
  outputType: "checker";
  chaptersDetected: number;
  issues: string[];
  fontUsed: string;
  trimSize: string;
  pageCount: number;
  trimDetected: string;
  trimMatchKDP: boolean;
  kdpTrimName: string | null;
  recommendations: string[];
  fileSizeMB?: number;
  recommendedGutterInches: number;
  page_issues: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
  hasPdfPreview?: boolean;
  pdfSourceUrl?: string;
}

function buildReportFromPreflightOnly(preflight: PreflightReport | null | undefined, fileSizeMB?: number): CheckerReport {
  const errors = (preflight != null && Array.isArray(preflight.errors)) ? preflight.errors : [];
  const warnings = (preflight != null && Array.isArray(preflight.warnings)) ? preflight.warnings : [];
  const totalPages =
    preflight?.summary != null && typeof preflight.summary.total_pages === "number"
      ? preflight.summary.total_pages
      : 0;
  const issues = [
    ...errors.map((e) => `[p.${e.page}] ${e.message}`),
    ...warnings.map((w) => `[p.${w.page}] ${w.message}`),
  ];
  const recommendations =
    preflight?.status === "PASS"
      ? ["Full KDP preflight (26 rules) passed. No errors found."]
      : ["Fix the issues above before uploading to KDP."];
  const page_issues = preflight?.page_issues ?? [
    ...errors.map((e) => ({ page: e.page, rule_id: e.rule_id, severity: e.severity, message: e.message, bbox: e.bbox ?? null })),
    ...warnings.map((w) => ({ page: w.page, rule_id: w.rule_id, severity: w.severity, message: w.message, bbox: w.bbox ?? null })),
  ];
  return {
    outputType: "checker" as const,
    chaptersDetected: 0,
    issues,
    fontUsed: "",
    trimSize: "",
    pageCount: totalPages,
    trimDetected: "—",
    trimMatchKDP: false,
    kdpTrimName: null as string | null,
    recommendations,
    fileSizeMB: fileSizeMB ?? undefined,
    recommendedGutterInches: getGutterInches(totalPages),
    page_issues,
  };
}

export interface RunPrintReadyCheckParams {
  fileKey: string;
  ourJobId: string;
  fileSizeMB?: number;
  /** Optional override. If omitted, uses process.env.KDP_PREFLIGHT_API_URL with fallback to DEFAULT_PREFLIGHT_BASE_URL. */
  baseUrl?: string;
}

/**
 * Run preflight for the PDF at fileKey, save report and meta, return the download id.
 * Throws on failure (caller should set job status to failed with message).
 */
// Keep below the DB reclaim window in `claim_print_ready_check` (15m),
// otherwise a second worker could pick the same job while we still run.
const PREFLIGHT_STATUS_DEADLINE_MS = 840000; // 14 min for large PDFs

const STATUS_POLL_TIMEOUT_MS = 10_000;

export async function runPrintReadyCheck(params: RunPrintReadyCheckParams): Promise<{ downloadId: string }> {
  const { fileKey, ourJobId, fileSizeMB, baseUrl } = params;
  const envUrl = process.env.KDP_PREFLIGHT_API_URL?.trim();
  const url = (envUrl || baseUrl || DEFAULT_PREFLIGHT_BASE_URL).replace(/\/$/, "");

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await getFileByKey(fileKey);
  } catch (e) {
    console.error("[printReadyCheckProcess] R2 getFileByKey error:", e instanceof Error ? e.stack : e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("getFileByKey") || msg.includes("R2")) {
      throw new Error("File not found in storage. The upload may not have completed — please try again.");
    }
    throw e;
  }
  const inspect = await inspectPdfBufferForChecker(pdfBuffer);

  const form = new FormData();
  form.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "document.pdf");
  const uploadRes = await fetch(`${url}/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(180000),
  });
  const uploadResText = await uploadRes.clone().text().catch((e) => `<<failed to read body: ${String(e)}>>`);
  if (!uploadRes.ok) {
    throw new Error(uploadResText || `Preflight upload failed (${uploadRes.status}).`);
  }
  let uploadData: { job_id?: string } | null = null;
  try {
    uploadData = (uploadResText ? (JSON.parse(uploadResText) as { job_id?: string }) : null) ?? null;
  } catch (e) {
    console.error("[printReadyCheckProcess] upload JSON parse failed:", e instanceof Error ? e.stack : e);
    uploadData = null;
  }
  const renderJobId = (uploadData != null && typeof uploadData.job_id === "string") ? uploadData.job_id : "";
  if (!renderJobId) {
    throw new Error("No job_id from preflight.");
  }

  const deadline = Date.now() + PREFLIGHT_STATUS_DEADLINE_MS;
  let completed = false;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));
    const statusUrl = `${url}/status/${encodeURIComponent(renderJobId)}`;
    const statusController = new AbortController();
    const statusTimeout = setTimeout(() => statusController.abort(), STATUS_POLL_TIMEOUT_MS);
    let statusRes: Response;
    try {
      statusRes = await fetch(statusUrl, { signal: statusController.signal });
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        console.warn("[printReadyCheckProcess] preflight status poll timed out; continuing", { statusUrl });
        continue;
      }
      throw e;
    } finally {
      clearTimeout(statusTimeout);
    }
    if (!statusRes.ok) continue;
    const statusText = await statusRes.clone().text().catch((e) => `<<failed to read body: ${String(e)}>>`);
    let statusData: { status?: string } | null = null;
    try {
      statusData = (statusText ? (JSON.parse(statusText) as { status?: string }) : null) ?? null;
    } catch (e) {
      console.error("[printReadyCheckProcess] status JSON parse failed:", e instanceof Error ? e.stack : e);
      statusData = null;
    }
    if (statusData?.status === "completed") {
      completed = true;
      break;
    }
    if (statusData?.status === "failed") {
      throw new Error("Preflight validation failed.");
    }
  }
  if (!completed) {
    throw new Error("Preflight is taking longer than expected. Try a smaller file, use our free PDF Compressor to shrink it, or try again later.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  let res: Response;
  try {
    const reportUrl = `${url}/report/${encodeURIComponent(renderJobId)}`;
    res = await fetch(reportUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    throw new Error(`Preflight report failed (${res.status}).`);
  }
  const reportText = await res.clone().text().catch((e) => `<<failed to read body: ${String(e)}>>`);
  let preflight: PreflightReport | null = null;
  try {
    preflight = (reportText ? (JSON.parse(reportText) as PreflightReport) : null) ?? null;
  } catch (e) {
    console.error("[printReadyCheckProcess] report JSON parse failed:", e instanceof Error ? e.stack : e);
    preflight = null;
  }
  const approval_likelihood = preflight?.approval_likelihood ?? null;
  const report: CheckerReport = buildReportFromPreflightOnly(preflight, fileSizeMB);
  if (inspect) {
    const fromPreflight = report.pageCount;
    report.pageCount = Math.max(fromPreflight, inspect.pageCount);
    report.trimDetected = inspect.trimDetected;
    report.trimMatchKDP = inspect.trimMatchKDP;
    report.kdpTrimName = inspect.kdpTrimName;
    report.trimSize = inspect.trimSize;
    report.recommendedGutterInches = getGutterInches(report.pageCount);
  }
  report.hasPdfPreview = true;
  report.pdfSourceUrl = `/api/r2-file?key=${encodeURIComponent(fileKey)}`;
  const enrichedReport = enrichCheckerReport(report, "Uploaded PDF", preflight ?? undefined);

  const issues = enrichedReport.issuesEnriched ?? [];
  const criticalCount = issues.filter((i: { fixDifficulty?: string }) => i.fixDifficulty === "advanced").length;
  const moderateCount = issues.filter((i: { fixDifficulty?: string }) => i.fixDifficulty === "moderate").length;
  const easyCount = issues.length - criticalCount - moderateCount;
  const calculatedScore =
    issues.length === 0
      ? 95
      : Math.max(5, Math.min(100, 100 - criticalCount * 15 - moderateCount * 5 - easyCount * 2));
  enrichedReport.readinessScore100 = calculatedScore;
  enrichedReport.kdpPassProbability = calculatedScore;

  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  const minimalPdf = Buffer.from(await doc.save());
  const stored = await saveUpload(minimalPdf, "preflight-report.pdf", "application/pdf");
  await updateMeta(stored.id, { processingReport: enrichedReport as StoredManuscript["processingReport"] });

  try {
    const issuesCount = enrichedReport?.issuesEnriched?.length ?? report?.issues?.length ?? 0;

    // Derive per-check status from preflight errors by rule_id and message text
    const allErrors = [...(preflight?.errors ?? []), ...(preflight?.warnings ?? [])];
    const hasIssue = (terms: string[]) =>
      allErrors.some((e) => {
        const haystack = `${e.rule_id ?? ""} ${e.message ?? ""}`.toLowerCase();
        return terms.some((t) => haystack.includes(t));
      });
    const trim_ok    = !hasIssue(["trim", "page size", "page_size", "dimensions", "paper size"]);
    const margins_ok = !hasIssue(["margin"]);
    const bleed_ok   = !hasIssue(["bleed"]);
    const fonts_ok   = !hasIssue(["font", "embed"]);

    await supabase.from("verification_results").upsert(
      {
        verification_id: stored.id,
        filename_clean: "Uploaded PDF — PDF",
        readiness_score: calculatedScore,
        approval_likelihood: approval_likelihood,
        kdp_ready: enrichedReport?.kdpReady,
        scan_date: enrichedReport?.scanDate,
        issues_count: issuesCount,
        trim_ok,
        margins_ok,
        bleed_ok,
        fonts_ok,
      },
      { onConflict: "verification_id" }
    );
  } catch (e) {
    console.error("[printReadyCheckProcess] verification_results upsert failed:", e);
  }

  try {
    await updateMeta(stored.id, {
      annotatedPdfStatus: "processing",
      annotatedPdfUrl: `${url}/file/${encodeURIComponent(renderJobId)}/annotated`,
    });
    const annotateRes = await fetch(`${url}/annotate/${encodeURIComponent(renderJobId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_issues: (preflight?.page_issues ?? report.page_issues ?? []).map((issue) => ({
          page: issue.page,
          rule_id: issue.rule_id,
          severity: issue.severity,
          message: issue.message,
          bbox: issue.bbox ?? null,
        })),
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (annotateRes.ok) {
      const annotateData = (await annotateRes.json()) as { r2_key?: string; status?: string };
      if (annotateData.r2_key && process.env.USE_R2 === "true") {
        try {
          const annotatedPdfDownloadUrl = await getSignedUrlForKey(annotateData.r2_key);
          await updateMeta(stored.id, { annotatedPdfDownloadUrl, annotatedPdfStatus: "ready" });
        } catch (e) {
          console.error("[printReadyCheckProcess] annotate signed url error:", e);
        }
      }
    } else {
      console.error("[printReadyCheckProcess] annotate engine returned", annotateRes.status);
    }
  } catch (e) {
    console.error("[printReadyCheckProcess] annotate trigger error:", e);
  }

  if (process.env.USE_R2 === "true" && stored?.storedPath) {
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

  return { downloadId: stored.id };
}
