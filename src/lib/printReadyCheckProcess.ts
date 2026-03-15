/**
 * Core logic: run KDP preflight for an R2 PDF and save the checker result.
 * Used by the async worker; not used by the API route (route only enqueues).
 * Requires: getFileByKey, saveUpload, updateMeta, supabase, enrichCheckerReport, getGutterInches.
 */
import { PDFDocument } from "pdf-lib";
import { saveUpload, updateMeta, type StoredManuscript } from "./storage";
import { getSignedDownloadUrl, getFileByKey } from "./r2Storage";
import { getGutterInches } from "./kdpConfig";
import { supabase } from "./supabase";
import { enrichCheckerReport } from "./kdpReportEnhance";

export interface PreflightReport {
  status: string;
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

function buildReportFromPreflightOnly(preflight: PreflightReport, fileSizeMB?: number): CheckerReport {
  const errors = Array.isArray(preflight.errors) ? preflight.errors : [];
  const warnings = Array.isArray(preflight.warnings) ? preflight.warnings : [];
  const issues = [
    ...errors.map((e) => `[p.${e.page}] ${e.message}`),
    ...warnings.map((w) => `[p.${w.page}] ${w.message}`),
  ];
  const recommendations =
    preflight.status === "PASS"
      ? ["Full KDP preflight (26 rules) passed. No errors found."]
      : ["Fix the issues above before uploading to KDP."];
  const page_issues = preflight.page_issues ?? [
    ...errors.map((e) => ({ page: e.page, rule_id: e.rule_id, severity: e.severity, message: e.message, bbox: e.bbox ?? null })),
    ...warnings.map((w) => ({ page: w.page, rule_id: w.rule_id, severity: w.severity, message: w.message, bbox: w.bbox ?? null })),
  ];
  return {
    outputType: "checker" as const,
    chaptersDetected: 0,
    issues,
    fontUsed: "",
    trimSize: "",
    pageCount: preflight.summary.total_pages,
    trimDetected: "—",
    trimMatchKDP: false,
    kdpTrimName: null as string | null,
    recommendations,
    fileSizeMB: fileSizeMB ?? undefined,
    recommendedGutterInches: getGutterInches(preflight.summary.total_pages),
    page_issues,
  };
}

export interface RunPrintReadyCheckParams {
  fileKey: string;
  ourJobId: string;
  fileSizeMB?: number;
  baseUrl: string;
}

/**
 * Run preflight for the PDF at fileKey, save report and meta, return the download id.
 * Throws on failure (caller should set job status to failed with message).
 */
export async function runPrintReadyCheck(params: RunPrintReadyCheckParams): Promise<{ downloadId: string }> {
  const { fileKey, ourJobId, fileSizeMB, baseUrl } = params;
  const url = baseUrl.replace(/\/$/, "");

  const pdfBuffer = await getFileByKey(fileKey);
  const form = new FormData();
  form.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), "document.pdf");
  const uploadRes = await fetch(`${url}/upload`, { method: "POST", body: form });
  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(text || `Preflight upload failed (${uploadRes.status}).`);
  }
  const uploadData = (await uploadRes.json()) as { job_id?: string };
  const renderJobId = typeof uploadData.job_id === "string" ? uploadData.job_id : "";
  if (!renderJobId) {
    throw new Error("No job_id from preflight.");
  }

  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));
    const statusRes = await fetch(`${url}/status/${encodeURIComponent(renderJobId)}`);
    if (!statusRes.ok) continue;
    const statusData = (await statusRes.json()) as { status?: string };
    if (statusData.status === "completed") break;
    if (statusData.status === "failed") {
      throw new Error("Preflight validation failed.");
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  let res: Response;
  try {
    res = await fetch(`${url}/report/${encodeURIComponent(renderJobId)}`, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    throw new Error(`Preflight report failed (${res.status}).`);
  }
  const preflight = (await res.json()) as PreflightReport;
  const report: CheckerReport = buildReportFromPreflightOnly(preflight, fileSizeMB);
  report.hasPdfPreview = true;
  report.pdfSourceUrl = `${url}/file/${encodeURIComponent(renderJobId)}`;
  const enrichedReport = enrichCheckerReport(report, "Uploaded PDF", preflight);

  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  const minimalPdf = Buffer.from(await doc.save());
  const stored = await saveUpload(minimalPdf, "preflight-report.pdf", "application/pdf");
  await updateMeta(stored.id, { processingReport: enrichedReport as StoredManuscript["processingReport"] });

  try {
    const issuesCount = enrichedReport.issuesEnriched?.length ?? report.issues.length;
    await supabase.from("verification_results").upsert(
      {
        verification_id: stored.id,
        filename_clean: "Uploaded PDF — PDF",
        readiness_score: enrichedReport.readinessScore100,
        kdp_ready: enrichedReport.kdpReady,
        scan_date: enrichedReport.scanDate,
        issues_count: issuesCount,
      },
      { onConflict: "verification_id" }
    );
  } catch (e) {
    console.error("[printReadyCheckProcess] verification_results upsert failed:", e);
  }

  fetch(`${url}/annotate/${renderJobId}`, { method: "POST" }).catch(() => {});
  await updateMeta(stored.id, {
    annotatedPdfUrl: `${url}/file/${renderJobId}/annotated`,
    annotatedPdfStatus: "processing",
  });

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

  return { downloadId: stored.id };
}
