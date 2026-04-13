/**
 * Maps stored checker metadata → data for @react-pdf compliance report.
 * Mirrors format-report sanitize logic so PDF matches paid download view.
 */
import type { StoredManuscript } from "@/lib/storage";
import {
  cleanFilenameForDisplay,
  getScoreGrade,
  normalizeIssueSeverity,
  canonicalCheckerReadinessScore,
  type CheckerReadinessFields,
  type NormalizedIssueSeverity,
} from "@/lib/kdpReportEnhance";

export interface CheckerReportData {
  grade: string;
  score: number;
  verdict: "pass" | "needs-fixes";
  blockers: number;
  warnings: number;
  info: number;
  approvalLikelihood: number;
  riskLevel: "Low" | "Medium" | "High";
  scanContext: {
    trimSize: string;
    bleed: boolean;
    colorMode: string;
    format: string;
  };
  checklist: Array<{ item: string; status: "pass" | "fail" | "warning" }>;
  specTable: Array<{
    requirement: string;
    yourFile: string;
    kdpRequired: string;
    status: "pass" | "fail" | "warning";
  }>;
  issues: Array<{
    severity: "blocker" | "warning" | "info";
    title: string;
    pages: number[];
    fixTime: string;
    description: string;
    howToFix: string;
  }>;
  filename: string;
  scanDate: string;
}

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

function fixTimeLabel(diff: string): string {
  const d = (diff || "").toLowerCase();
  if (d === "easy") return "~2 min";
  if (d === "moderate") return "~15 min";
  if (d === "advanced") return "~45 min+";
  return "~10 min";
}

function titleFromIssue(human: string, fallback: string): string {
  const t = human.trim();
  if (!t) return fallback;
  const cut = t.indexOf(".") > 0 ? t.slice(0, Math.min(t.indexOf(".") + 1, 90)) : t.slice(0, 88);
  return cut.length < t.length ? `${cut}…` : cut;
}

export function buildCheckerReportPdfData(meta: StoredManuscript): CheckerReportData | null {
  const raw = meta.processingReport as Record<string, unknown> | undefined;
  if (!raw || raw.outputType !== "checker") return null;

  const pageIssues = Array.isArray(raw.page_issues)
    ? (raw.page_issues as Array<{ page: number; rule_id: string; severity: string; message: string; bbox?: unknown }>)
    : [];

  const severities: NormalizedIssueSeverity[] =
    pageIssues.length > 0
      ? pageIssues.map((i) => normalizeIssueSeverity({ severity: i.severity, rule_id: i.rule_id, message: i.message }))
      : Array.isArray(raw.issuesEnriched)
        ? (
            raw.issuesEnriched as Array<{
              severity?: string;
              rule_id?: string;
              originalMessage?: string;
              humanMessage?: string;
            }>
          ).map((i) =>
            normalizeIssueSeverity({
              severity: i.severity,
              rule_id: i.rule_id,
              message: i.originalMessage ?? i.humanMessage,
            }),
          )
        : [];

  const blockerCount = severities.filter((s) => s === "blocker").length;
  const warningCount = severities.filter((s) => s === "warning").length;
  const infoCount = severities.filter((s) => s === "info").length;
  const structuralFail = hasUploadOrSpecHardFail(raw);
  const verdict: "pass" | "needs-fixes" =
    blockerCount > 0 || structuralFail ? "needs-fixes" : "pass";

  const score = canonicalCheckerReadinessScore(raw as CheckerReadinessFields);
  const scoreNum = score ?? 0;

  let scoreGrade = raw.scoreGrade as { grade: string; label: string; description: string } | undefined;
  if (verdict === "needs-fixes") {
    const base = typeof score === "number" && Number.isFinite(score) ? score : 70;
    scoreGrade = getScoreGrade(Math.min(base, 84));
  } else if (!scoreGrade && typeof score === "number" && Number.isFinite(score)) {
    scoreGrade = getScoreGrade(score);
  }
  if (!scoreGrade) scoreGrade = getScoreGrade(Math.max(0, Math.min(100, scoreNum)));

  const approvalLikelihood =
    typeof raw.kdpPassProbability === "number" && Number.isFinite(raw.kdpPassProbability)
      ? Math.round(raw.kdpPassProbability)
      : scoreNum;

  const riskLevel = (raw.riskLevel as CheckerReportData["riskLevel"]) || "Low";

  const intendedId = typeof raw.intendedKdpTrimId === "string" ? raw.intendedKdpTrimId.trim() : "";
  const format = intendedId.startsWith("hc-") ? "Hardcover" : "Paperback";

  const trimSize =
    (typeof raw.trimDetected === "string" && raw.trimDetected) ||
    (typeof raw.kdpTrimName === "string" && raw.kdpTrimName) ||
    "—";

  const checklistRaw = Array.isArray(raw.uploadChecklist)
    ? (raw.uploadChecklist as Array<{ check: string; status: "pass" | "warning" | "fail" }>)
    : [];
  const bleedRow = checklistRaw.find((c) => /bleed/i.test(c.check));
  const bleed = bleedRow?.status === "pass";

  const colorMode =
    typeof raw.creationTool === "string" && raw.creationTool !== "unknown"
      ? `Tool: ${raw.creationTool.replace(/_/g, " ")}`
      : "Interior PDF";

  const checklist = checklistRaw.map((c) => ({ item: c.check, status: c.status }));

  const specRaw = Array.isArray(raw.specTable)
    ? (raw.specTable as Array<{ requirement: string; yourFile: string; kdpRequired: string; status: "pass" | "warning" | "fail" }>)
    : [];
  const specTable = specRaw.map((r) => ({
    requirement: r.requirement,
    yourFile: r.yourFile,
    kdpRequired: r.kdpRequired,
    status: r.status,
  }));

  const enriched = Array.isArray(raw.issuesEnriched)
    ? (raw.issuesEnriched as Array<{
        humanMessage: string;
        fixDifficulty: string;
        page?: number;
        rule_id?: string;
        severity?: string;
        originalMessage?: string;
        toolFixInstruction?: string;
      }>)
    : [];

  const issues: CheckerReportData["issues"] = [];

  if (enriched.length) {
    for (const row of enriched) {
      const sev = normalizeIssueSeverity({
        severity: row.severity,
        rule_id: row.rule_id,
        message: row.originalMessage ?? row.humanMessage,
      });
      issues.push({
        severity: sev,
        title: titleFromIssue(row.humanMessage, row.rule_id || "Issue"),
        pages: typeof row.page === "number" && row.page > 0 ? [row.page] : [],
        fixTime: fixTimeLabel(row.fixDifficulty),
        description: row.humanMessage || row.originalMessage || "",
        howToFix: (row.toolFixInstruction as string) || "See KDP Help pages for this rule, or re-export with your layout app’s PDF preset.",
      });
    }
  } else if (pageIssues.length) {
    for (const row of pageIssues) {
      const sev = normalizeIssueSeverity({ severity: row.severity, rule_id: row.rule_id, message: row.message });
      issues.push({
        severity: sev,
        title: titleFromIssue(row.message, row.rule_id),
        pages: row.page > 0 ? [row.page] : [],
        fixTime: "~10 min",
        description: row.message,
        howToFix: "Address this item in your source file, then re-run the checker.",
      });
    }
  }

  const fn =
    typeof raw.fileNameScanned === "string" && raw.fileNameScanned
      ? cleanFilenameForDisplay(raw.fileNameScanned)
      : meta.originalName || "report";

  const scanDate =
    typeof raw.scanDate === "string" && raw.scanDate
      ? raw.scanDate
      : new Date(meta.createdAt).toISOString();

  return {
    grade: scoreGrade.grade,
    score: scoreNum,
    verdict,
    blockers: blockerCount,
    warnings: warningCount,
    info: infoCount,
    approvalLikelihood,
    riskLevel,
    scanContext: {
      trimSize,
      bleed,
      colorMode,
      format,
    },
    checklist,
    specTable,
    issues,
    filename: fn,
    scanDate,
  };
}
