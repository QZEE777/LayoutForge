import type { PreflightReport } from "./printReadyCheckProcess";

/** A successful HTTP response is not evidence that a PDF was checked. */
export function assertCompletePreflightReport(value: unknown): asserts value is PreflightReport {
  const invalid = () => { throw new Error("The PDF check did not return a complete report. Please try again."); };
  if (!value || typeof value !== "object") return invalid();
  const r = value as PreflightReport;
  if (!["PASS", "FAIL"].includes(r.status) || !Array.isArray(r.errors) || !Array.isArray(r.warnings)) return invalid();
  const s = r.summary;
  if (!s || !Number.isInteger(s.total_pages) || s.total_pages < 1 ||
      !Number.isInteger(s.rules_checked) || s.rules_checked < 1 ||
      s.error_count !== r.errors.length || s.warning_count !== r.warnings.length) return invalid();
  if ((r.status === "PASS") !== (r.errors.length === 0)) return invalid();
  const issueValid = (issue: PreflightReport["errors"][number]) => issue &&
    Number.isInteger(issue.page) && issue.page >= 1 && issue.page <= s.total_pages &&
    typeof issue.rule_id === "string" && issue.rule_id.length > 0 &&
    typeof issue.message === "string" && issue.message.length > 0 &&
    typeof issue.severity === "string";
  if (![...r.errors, ...r.warnings].every(issueValid)) return invalid();
  if (r.page_issues !== undefined && (!Array.isArray(r.page_issues) || !r.page_issues.every(issueValid))) return invalid();
  if (r.page_issues !== undefined && r.page_issues.length !== r.errors.length + r.warnings.length) return invalid();
  for (const score of [r.readiness_score, r.approval_likelihood]) {
    if (score !== undefined && (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100)) return invalid();
  }
}
