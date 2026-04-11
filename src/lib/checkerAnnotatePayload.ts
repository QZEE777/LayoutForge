import { CHECKER_ANNOTATION_PASS_THRESHOLD } from "./checkerAnnotationStyle";

export type AnnotatePageIssue = {
  page: number;
  rule_id: string;
  severity: string;
  message: string;
  bbox: number[] | null;
};

type PreflightSummaryLike = {
  rules_checked?: number;
  error_count?: number;
  warning_count?: number;
} | null | undefined;

/**
 * JSON body for POST `{preflight}/annotate/{job_id}` — must match
 * `kdp-preflight-engine` `annotate_pdf_inline` / `_draw_summary_page` keys.
 */
export function buildCheckerAnnotateReportBody(params: {
  pageIssues: AnnotatePageIssue[];
  readinessScore100: number;
  preflightSummary?: PreflightSummaryLike;
  /** Shown on PDF summary page header (optional). */
  displayFilename?: string | null;
}): Record<string, unknown> {
  const rulesChecked =
    typeof params.preflightSummary?.rules_checked === "number" && params.preflightSummary.rules_checked > 0
      ? params.preflightSummary.rules_checked
      : 26;
  const errN =
    typeof params.preflightSummary?.error_count === "number" && params.preflightSummary.error_count >= 0
      ? params.preflightSummary.error_count
      : 0;
  const warnN =
    typeof params.preflightSummary?.warning_count === "number" && params.preflightSummary.warning_count >= 0
      ? params.preflightSummary.warning_count
      : 0;
  const passedChecks = Math.max(0, rulesChecked - errN - warnN);
  const score = Math.max(0, Math.min(100, Math.round(Number(params.readinessScore100) || 0)));

  const body: Record<string, unknown> = {
    page_issues: params.pageIssues,
    score,
    total_checks: rulesChecked,
    passed_checks: passedChecks,
    pass_threshold: CHECKER_ANNOTATION_PASS_THRESHOLD,
  };
  const fn = typeof params.displayFilename === "string" ? params.displayFilename.trim() : "";
  if (fn) body.display_filename = fn.slice(0, 180);
  return body;
}
