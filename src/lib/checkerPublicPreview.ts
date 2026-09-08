/** Allowlist only: the free score preview must never contain manuscript or paid report data. */
import { parseCheckerPrintOptions } from "./checkerPrintOptions";
export function checkerPublicPreview(report: Record<string, unknown>) {
  let printOptions;
  try { printOptions = parseCheckerPrintOptions(report.printOptions); } catch { /* Legacy report has no options. */ }
  return {
    id: report.id, source: "checker", outputType: "checker", previewOnly: true,
    printOptions,
    score: report.score, readinessScore100: report.readinessScore100,
    verdict: report.verdict, kdpReady: report.kdpReady, scoreGrade: report.scoreGrade,
    blockerCount: report.blockerCount, warningCount: report.warningCount,
    infoCount: report.infoCount, issueCount: report.issueCount,
    pageCount: report.pageCount, trimDetected: report.trimDetected,
    trimSize: report.trimSize, trimMatchKDP: report.trimMatchKDP,
    issues: [], chaptersDetected: 0, fontUsed: "",
  };
}
