import { NextRequest, NextResponse } from "next/server";
import { getStored } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

type PublicCheckerReport = {
  outputType: "checker";
  outputFilename?: string;
  issues: string[];
  chaptersDetected: number;
  fontUsed: string;
  trimSize: string;
  pageCount?: number;
  trimDetected?: string;
  trimMatchKDP?: boolean;
  kdpTrimName?: string | null;
  recommendations?: string[];
  fileSizeMB?: number;
  recommendedGutterInches?: number;
  page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
  hasPdfPreview?: boolean;
  pdfSourceUrl?: string;
  annotatedPdfUrl?: string;
  annotatedPdfStatus?: string;
  annotatedPdfDownloadUrl?: string;
  scanDate?: string;
  fileNameScanned?: string;
  kdpPassProbability?: number;
  riskLevel?: "Low" | "Medium" | "High";
  readinessScore100?: number;
  readiness_score?: number;
  highRiskPageNumbers?: number[];
  kdpReady?: boolean;
  issuesEnriched?: Array<{
    originalMessage: string;
    humanMessage: string;
    toolFixInstruction?: string;
    fixDifficulty: string;
    page?: number;
    severity?: string;
  }>;
  scoreGrade?: { grade: string; label: string; description: string };
  creationTool?: string;
  uploadChecklist?: Array<{ check: string; status: "pass" | "warning" | "fail" }>;
  specTable?: Array<{ requirement: string; yourFile: string; kdpRequired: string; status: "pass" | "warning" | "fail" }>;
  estimatedFixHours?: number;
  upsellBridge?: string;
  advisoryNotices?: Array<{ rule_id: string; message: string; severity: "info" | "warning" }>;
  score?: number;
  verdict?: "pass" | "needs-fixes";
};

function toCanonicalScore(report: Record<string, unknown>): number | undefined {
  const candidate = [report.readinessScore100, report.readiness_score, report.kdpPassProbability]
    .map((n) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : undefined))
    .find((n) => typeof n === "number");
  return candidate;
}

/** Returns sanitized public payload for Tool #1 (never spread raw metadata). */
function sanitizeCheckerReport(reportLike: Record<string, unknown>, outputFilename?: string): PublicCheckerReport {
  const score = toCanonicalScore(reportLike);
  const readinessScore100 = score ?? (typeof reportLike.readinessScore100 === "number" ? reportLike.readinessScore100 : undefined);
  return {
    outputType: "checker",
    outputFilename,
    issues: Array.isArray(reportLike.issues) ? (reportLike.issues as string[]) : [],
    chaptersDetected: typeof reportLike.chaptersDetected === "number" ? reportLike.chaptersDetected : 0,
    fontUsed: typeof reportLike.fontUsed === "string" ? reportLike.fontUsed : "",
    trimSize: typeof reportLike.trimSize === "string" ? reportLike.trimSize : "",
    pageCount: typeof reportLike.pageCount === "number" ? reportLike.pageCount : undefined,
    trimDetected: typeof reportLike.trimDetected === "string" ? reportLike.trimDetected : undefined,
    trimMatchKDP: typeof reportLike.trimMatchKDP === "boolean" ? reportLike.trimMatchKDP : undefined,
    kdpTrimName: typeof reportLike.kdpTrimName === "string" || reportLike.kdpTrimName == null ? (reportLike.kdpTrimName as string | null | undefined) : undefined,
    recommendations: Array.isArray(reportLike.recommendations) ? (reportLike.recommendations as string[]) : undefined,
    fileSizeMB: typeof reportLike.fileSizeMB === "number" ? reportLike.fileSizeMB : undefined,
    recommendedGutterInches: typeof reportLike.recommendedGutterInches === "number" ? reportLike.recommendedGutterInches : undefined,
    page_issues: Array.isArray(reportLike.page_issues) ? (reportLike.page_issues as PublicCheckerReport["page_issues"]) : undefined,
    hasPdfPreview: !!reportLike.hasPdfPreview,
    pdfSourceUrl: typeof reportLike.pdfSourceUrl === "string" ? reportLike.pdfSourceUrl : undefined,
    annotatedPdfUrl: typeof reportLike.annotatedPdfUrl === "string" ? reportLike.annotatedPdfUrl : undefined,
    annotatedPdfStatus: typeof reportLike.annotatedPdfStatus === "string" ? reportLike.annotatedPdfStatus : undefined,
    annotatedPdfDownloadUrl: typeof reportLike.annotatedPdfDownloadUrl === "string" ? reportLike.annotatedPdfDownloadUrl : undefined,
    scanDate: typeof reportLike.scanDate === "string" ? reportLike.scanDate : undefined,
    fileNameScanned: typeof reportLike.fileNameScanned === "string" ? reportLike.fileNameScanned : undefined,
    kdpPassProbability: typeof reportLike.kdpPassProbability === "number" ? reportLike.kdpPassProbability : undefined,
    riskLevel: reportLike.riskLevel as PublicCheckerReport["riskLevel"] | undefined,
    readinessScore100,
    readiness_score: readinessScore100,
    highRiskPageNumbers: Array.isArray(reportLike.highRiskPageNumbers) ? (reportLike.highRiskPageNumbers as number[]) : undefined,
    kdpReady: typeof reportLike.kdpReady === "boolean" ? reportLike.kdpReady : undefined,
    issuesEnriched: Array.isArray(reportLike.issuesEnriched) ? (reportLike.issuesEnriched as PublicCheckerReport["issuesEnriched"]) : undefined,
    scoreGrade: (reportLike.scoreGrade as PublicCheckerReport["scoreGrade"]) ?? undefined,
    creationTool: typeof reportLike.creationTool === "string" ? reportLike.creationTool : undefined,
    uploadChecklist: Array.isArray(reportLike.uploadChecklist) ? (reportLike.uploadChecklist as PublicCheckerReport["uploadChecklist"]) : undefined,
    specTable: Array.isArray(reportLike.specTable) ? (reportLike.specTable as PublicCheckerReport["specTable"]) : undefined,
    estimatedFixHours: typeof reportLike.estimatedFixHours === "number" ? reportLike.estimatedFixHours : undefined,
    upsellBridge: typeof reportLike.upsellBridge === "string" ? reportLike.upsellBridge : undefined,
    advisoryNotices: Array.isArray(reportLike.advisoryNotices) ? (reportLike.advisoryNotices as PublicCheckerReport["advisoryNotices"]) : undefined,
    score,
    verdict: (typeof score === "number" ? (score >= 95 ? "pass" : "needs-fixes") : (reportLike.kdpReady ? "pass" : "needs-fixes")),
  };
}

async function buildReportFromStored(meta: Awaited<ReturnType<typeof getStored>>) {
  if (!meta) return null;
  const processing = meta.processingReport as Record<string, unknown> | undefined;

  const report = processing
    ? (processing.outputType === "checker"
      ? sanitizeCheckerReport(
          {
            ...processing,
            annotatedPdfUrl: meta.annotatedPdfUrl ?? processing.annotatedPdfUrl,
            annotatedPdfDownloadUrl: meta.annotatedPdfDownloadUrl ?? processing.annotatedPdfDownloadUrl,
            annotatedPdfStatus: meta.annotatedPdfStatus ?? processing.annotatedPdfStatus,
          },
          meta.outputFilename
        )
      : {
          ...processing,
          outputFilename: meta.outputFilename,
        })
    : meta.outputFilename
      ? {
          chaptersDetected: 0,
          issues: [],
          fontUsed: "",
          trimSize: "",
          outputFilename: meta.outputFilename,
          outputType: meta.mimeType?.includes("epub") ? "epub" : "pdf",
        }
      : null;

  if (!report) return null;
  return report;
}

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing id", message: "Provide ?id=..." },
        { status: 400 }
      );
    }

    // Validate UUID shape before interpolating into PostgREST .or() filter
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { error: "Invalid id", message: "id must be a valid UUID." },
        { status: 400 }
      );
    }

    let meta = await getStored(id);
    let report = await buildReportFromStored(meta);

    // Defensive fallback: `id` may be print_ready_checks.id (check row) or result_download_id (stored report id).
    // Resolve to result_download_id, then load metadata.
    if (!report) {
      try {
        const { data: prcRow } = await supabase
          .from("print_ready_checks")
          .select("result_download_id")
          .or(`id.eq.${id},result_download_id.eq.${id}`)
          .maybeSingle();

        const resultDownloadId = prcRow?.result_download_id;
        if (typeof resultDownloadId === "string" && resultDownloadId) {
          meta = await getStored(resultDownloadId);
          report = await buildReportFromStored(meta);
        }
      } catch {
        // ignore fallback errors; preserve original 404 behavior
      }
    }

    if (!report) {
      return NextResponse.json(
        { error: "Not found", message: "No processing report for this file." },
        { status: 404 }
      );
    }
    // Strip outputFilename for unpaid downloads — the download route enforces
    // payment_confirmed independently, but no need to leak the filename to unpaid callers.
    const isPaid = meta?.payment_confirmed === true;
    const safeReport = isPaid ? report : { ...report, outputFilename: undefined };

    return NextResponse.json({
      success: true,
      report: safeReport,
    });
  } catch (e) {
    console.error("[format-report]", e);
    return NextResponse.json(
      { error: "Internal error", message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
