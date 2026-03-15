/**
 * POST { jobId, fileSizeMB? } or { jobId, fileKey, fileSizeMB? }.
 * - With fileKey (R2 flow): enqueue job and return checkId immediately. Worker processes it; frontend polls GET /api/print-ready-check-status.
 * - Without fileKey: sync flow (jobId is preflight engine job id), fetch report and return id (legacy).
 */
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { PDFDocument } from "pdf-lib";
import { saveUpload, updateMeta, type StoredManuscript } from "@/lib/storage";
import { getSignedDownloadUrl, getFileByKey } from "@/lib/r2Storage";
import { getGutterInches } from "@/lib/kdpConfig";
import { supabase } from "@/lib/supabase";
import { enrichCheckerReport } from "@/lib/kdpReportEnhance";

interface PreflightReport {
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
  const issues = [
    ...preflight.errors.map((e) => `[p.${e.page}] ${e.message}`),
    ...preflight.warnings.map((w) => `[p.${w.page}] ${w.message}`),
  ];
  const recommendations =
    preflight.status === "PASS"
      ? ["Full KDP preflight (26 rules) passed. No errors found."]
      : ["Fix the issues above before uploading to KDP."];
  const page_issues = preflight.page_issues ?? [
    ...preflight.errors.map((e) => ({ page: e.page, rule_id: e.rule_id, severity: e.severity, message: e.message, bbox: e.bbox ?? null })),
    ...preflight.warnings.map((w) => ({ page: w.page, rule_id: w.rule_id, severity: w.severity, message: w.message, bbox: w.bbox ?? null })),
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

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.KDP_PREFLIGHT_API_URL?.trim();
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Preflight not configured", message: "KDP_PREFLIGHT_API_URL is not set." },
        { status: 503 }
      );
    }
    let body: { jobId?: string; fileKey?: string; fileSizeMB?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid body", message: "Send JSON with jobId (and optionally fileKey for R2 flow)." },
        { status: 400 }
      );
    }
    const jobId = typeof body.jobId === "string" ? body.jobId.trim() : "";
    if (!jobId) {
      return NextResponse.json(
        { error: "Missing jobId", message: "Send JSON with jobId." },
        { status: 400 }
      );
    }
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(jobId)) {
      return NextResponse.json(
        { error: "Invalid jobId", message: "jobId must be a valid UUID." },
        { status: 400 }
      );
    }
    const fileSizeMB = typeof body.fileSizeMB === "number" ? body.fileSizeMB : undefined;

    // R2 flow: enqueue and return checkId. Worker will process.
    if (typeof body.fileKey === "string" && /^uploads\/[0-9a-fA-F-]+\.pdf$/.test(body.fileKey.trim())) {
      const fileKey = body.fileKey.trim();
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { error: "Server not configured", message: "Supabase is not configured." },
          { status: 503 }
        );
      }
      const { data: row, error: insertError } = await supabase
        .from("print_ready_checks")
        .insert({
          file_key: fileKey,
          our_job_id: jobId,
          file_size_mb: fileSizeMB ?? null,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("[kdp-pdf-check-from-preflight] insert print_ready_checks failed:", insertError.message, insertError.code);
        return NextResponse.json(
          { error: "Enqueue failed", message: "Could not start check. Try again." },
          { status: 500 }
        );
      }
      if (!row?.id) {
        console.error("[kdp-pdf-check-from-preflight] insert succeeded but no row id returned");
        return NextResponse.json(
          { error: "Enqueue failed", message: "Could not start check. Try again." },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, checkId: row.id });
    }

    // Sync flow: jobId is preflight engine job id, fetch report directly (legacy / small flows).
    const url = baseUrl.replace(/\/$/, "");
    const renderJobId = jobId;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    let res: Response;
    try {
      res = await fetch(`${url}/report/${encodeURIComponent(renderJobId)}`, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "Preflight report failed", message: `Could not get report (${res.status}).` },
        { status: 502 }
      );
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
      console.error("[kdp-pdf-check-from-preflight] verification_results upsert failed:", e);
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

    return NextResponse.json({ success: true, id: stored.id });
  } catch (e) {
    console.error("[kdp-pdf-check-from-preflight]", e);
    return NextResponse.json(
      { error: "Internal error", message: e instanceof Error ? e.message : "Failed to save report." },
      { status: 500 }
    );
  }
}
