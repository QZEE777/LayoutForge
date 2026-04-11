import { NextRequest, NextResponse } from "next/server";
import { getStored, normalizeAnnotatedPdfStatus } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { getScoreGrade, normalizeIssueSeverity, type NormalizedIssueSeverity } from "@/lib/kdpReportEnhance";

type PublicCheckerReport = {
  id: string;
  source: "checker";
  outputType: "checker";
  verdict: "pass" | "needs-fixes";
  score?: number;
  blockerCount: number;
  warningCount: number;
  infoCount: number;
  issueCount: number;
  annotationStatus: ReturnType<typeof normalizeAnnotatedPdfStatus>;
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
  /** KDP trim id chosen on upload (e.g. 8.5x11); spec table compares against this when set. */
  intendedKdpTrimId?: string;
};

function toCanonicalScore(report: Record<string, unknown>): number | undefined {
  const candidate = [report.readinessScore100, report.readiness_score, report.kdpPassProbability]
    .map((n) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : undefined))
    .find((n) => typeof n === "number");
  return candidate;
}

/** Checklist / spec rows can show KDP-hard fails while issue severities stayed "warning" — fold into verdict. */
function hasUploadOrSpecHardFail(reportLike: Record<string, unknown>): boolean {
  const checklist = reportLike.uploadChecklist;
  if (Array.isArray(checklist)) {
    for (const row of checklist) {
      if (row && typeof row === "object" && (row as { status?: string }).status === "fail") return true;
    }
  }
  const spec = reportLike.specTable;
  if (Array.isArray(spec)) {
    for (const row of spec) {
      if (row && typeof row === "object" && (row as { status?: string }).status === "fail") return true;
    }
  }
  return false;
}

/** Returns sanitized public payload for Tool #1 (never spread raw metadata). */
function sanitizeCheckerReport(
  id: string,
  reportLike: Record<string, unknown>,
  outputFilename?: string,
  annotationStatusRaw?: string,
  sentAt?: number
): PublicCheckerReport {
  const score = toCanonicalScore(reportLike);
  const readinessScore100 = score ?? (typeof reportLike.readinessScore100 === "number" ? reportLike.readinessScore100 : undefined);
  const pageIssues: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }> =
    Array.isArray(reportLike.page_issues)
      ? (reportLike.page_issues as Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>)
      : [];
  const severities: NormalizedIssueSeverity[] =
    pageIssues.length > 0
      ? pageIssues.map((i) => normalizeIssueSeverity({ severity: i.severity, rule_id: i.rule_id, message: i.message }))
      : Array.isArray(reportLike.issuesEnriched)
        ? (reportLike.issuesEnriched as Array<{ severity?: string; rule_id?: string; originalMessage?: string; humanMessage?: string }>).map((i) =>
            normalizeIssueSeverity({ severity: i.severity, rule_id: i.rule_id, message: i.originalMessage ?? i.humanMessage })
          )
        : [];
  const blockerCount = severities.filter((s) => s === "blocker").length;
  const warningCount = severities.filter((s) => s === "warning").length;
  const infoCount = severities.filter((s) => s === "info").length;
  const issueCount = pageIssues.length > 0 ? pageIssues.length : severities.length;
  const annotationStatus = normalizeAnnotatedPdfStatus(annotationStatusRaw, sentAt);
  const structuralFail = hasUploadOrSpecHardFail(reportLike);
  const verdict: PublicCheckerReport["verdict"] =
    blockerCount > 0 || structuralFail ? "needs-fixes" : "pass";

  let scoreGradeOut = (reportLike.scoreGrade as PublicCheckerReport["scoreGrade"]) ?? undefined;
  if (verdict === "needs-fixes") {
    const base = typeof score === "number" && Number.isFinite(score) ? score : 70;
    scoreGradeOut = getScoreGrade(Math.min(base, 84));
  } else if (!scoreGradeOut && typeof score === "number" && Number.isFinite(score)) {
    scoreGradeOut = getScoreGrade(score);
  }

  return {
    id,
    source: "checker",
    outputType: "checker",
    verdict,
    score,
    blockerCount,
    warningCount,
    infoCount,
    issueCount,
    annotationStatus,
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
    page_issues: issueCount > 0 ? pageIssues : undefined,
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
    kdpReady: verdict === "pass",
    issuesEnriched: Array.isArray(reportLike.issuesEnriched) ? (reportLike.issuesEnriched as PublicCheckerReport["issuesEnriched"]) : undefined,
    scoreGrade: scoreGradeOut,
    creationTool: typeof reportLike.creationTool === "string" ? reportLike.creationTool : undefined,
    uploadChecklist: Array.isArray(reportLike.uploadChecklist) ? (reportLike.uploadChecklist as PublicCheckerReport["uploadChecklist"]) : undefined,
    specTable: Array.isArray(reportLike.specTable) ? (reportLike.specTable as PublicCheckerReport["specTable"]) : undefined,
    estimatedFixHours: typeof reportLike.estimatedFixHours === "number" ? reportLike.estimatedFixHours : undefined,
    upsellBridge: typeof reportLike.upsellBridge === "string" ? reportLike.upsellBridge : undefined,
    advisoryNotices: Array.isArray(reportLike.advisoryNotices) ? (reportLike.advisoryNotices as PublicCheckerReport["advisoryNotices"]) : undefined,
    intendedKdpTrimId:
      typeof reportLike.intendedKdpTrimId === "string" && reportLike.intendedKdpTrimId.trim()
        ? reportLike.intendedKdpTrimId.trim()
        : undefined,
  };
}

async function buildReportFromStored(meta: Awaited<ReturnType<typeof getStored>>) {
  if (!meta) return null;
  const processing = meta.processingReport as Record<string, unknown> | undefined;

  const report = processing
    ? (processing.outputType === "checker"
      ? sanitizeCheckerReport(
          meta.id,
          {
            ...processing,
            annotatedPdfUrl: meta.annotatedPdfUrl ?? processing.annotatedPdfUrl,
            annotatedPdfDownloadUrl: meta.annotatedPdfDownloadUrl ?? processing.annotatedPdfDownloadUrl,
            annotatedPdfStatus: meta.annotatedPdfStatus ?? processing.annotatedPdfStatus,
          },
          meta.outputFilename,
          (meta.annotatedPdfStatus ?? processing.annotatedPdfStatus) as string | undefined,
          meta.annotatedEmailSentAt
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
