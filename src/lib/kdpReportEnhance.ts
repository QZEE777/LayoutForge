/**
 * KDP compliance report enhancements: score, risk level, human-readable text,
 * fix difficulty labels, upload checklist, spec table, upsell bridge.
 */

export type FixDifficulty = "easy" | "moderate" | "advanced";

export interface EnrichedIssue {
  originalMessage: string;
  humanMessage: string;
  fixDifficulty: FixDifficulty;
  page?: number;
  rule_id?: string;
  severity?: string;
}

export interface ChecklistItem {
  check: string;
  status: "pass" | "warning" | "fail";
}

export interface SpecRow {
  requirement: string;
  yourFile: string;
  kdpRequired: string;
  status: "pass" | "warning" | "fail";
}

const EASY_KEYWORDS = ["margin", "metadata", "gutter", "inner margin", "outer margin", "trim size", "page size"];
const MODERATE_KEYWORDS = ["bleed", "crop", "safe area", "trim box"];
const ADVANCED_KEYWORDS = ["font", "embed", "layout", "color", "resolution", "image", "raster", "transparency"];

function toFixDifficulty(ruleId: string, message: string): FixDifficulty {
  const r = ruleId.toLowerCase();
  const m = message.toLowerCase();
  const combined = `${r} ${m}`;
  if (ADVANCED_KEYWORDS.some((k) => combined.includes(k))) return "advanced";
  if (MODERATE_KEYWORDS.some((k) => combined.includes(k))) return "moderate";
  if (EASY_KEYWORDS.some((k) => combined.includes(k))) return "easy";
  return "moderate";
}

const HUMAN_MAP: Array<{ pattern: RegExp | string; human: string }> = [
  [/margin.*violation|inner margin|outer margin|margin.*insufficient/i, "Text may be cut during printing — KDP will likely reject this file. Increase margins to at least 0.5\" inner (plus gutter for page count) and 0.25\" other sides."],
  [/bleed|trim.*outside|crop/i, "Content extends too close to the cut edge. KDP requires 0.125\" bleed; extend backgrounds and critical content into the bleed area."],
  [/trim.*size|page size|dimension/i, "Page dimensions don't match a KDP trim size. Re-export using a standard trim (e.g. 5×8, 6×9) in your layout tool."],
  [/font.*embed|embedded font|subset/i, "Fonts may not print correctly. Embed or subset all fonts in your PDF before uploading."],
  [/resolution|dpi|raster|image.*low/i, "Images may appear blurry in print. Use at least 300 DPI for all images."],
  [/transparency|overprint/i, "Transparency can cause print issues. Flatten or remove transparency before uploading."],
  [/page count|minimum.*24|maximum.*828/i, "Page count is outside KDP limits (24–828 pages). Add or remove pages to meet the requirement."],
  [/file size|650.*MB/i, "File exceeds KDP's 650 MB limit. Reduce image resolution or compress the PDF."],
  [/metadata|document info/i, "Document metadata may need updating for KDP. Set title and author in your PDF or in KDP's form."],
];

function toHumanMessage(message: string, _ruleId?: string): string {
  const lower = message.toLowerCase();
  for (const { pattern, human } of HUMAN_MAP) {
    if (typeof pattern === "string" ? lower.includes(pattern) : pattern.test(message)) return human;
  }
  return `${message} This may cause KDP to reject or delay your file. Fix before uploading.`;
}

export function enrichIssue(
  message: string,
  page: number | undefined,
  rule_id: string,
  severity: string
): EnrichedIssue {
  return {
    originalMessage: message,
    humanMessage: toHumanMessage(message, rule_id),
    fixDifficulty: toFixDifficulty(rule_id, message),
    page,
    rule_id,
    severity,
  };
}

/** 0 issues = 95%. Each critical (error) -15%, each warning -5%. Min 5%. */
export function computeKdpPassProbability(errorCount: number, warningCount: number): number {
  let score = 95;
  score -= errorCount * 15;
  score -= warningCount * 5;
  return Math.max(5, Math.min(95, score));
}

export function getRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score >= 80) return "Low";
  if (score >= 50) return "Medium";
  return "High";
}

/** Estimate fix time: easy ≈2 min, moderate ≈15 min, advanced ≈45 min. Return hours (0.5 step). */
export function estimateFixHours(issues: EnrichedIssue[]): number {
  let totalMin = 0;
  for (const i of issues) {
    if (i.fixDifficulty === "easy") totalMin += 2;
    else if (i.fixDifficulty === "moderate") totalMin += 15;
    else totalMin += 45;
  }
  const hours = totalMin / 60;
  if (hours <= 0) return 0;
  const step = 0.5;
  return Math.ceil(hours / step) * step;
}

export function buildUpsellBridge(issueCount: number, estimatedFixHours: number): string {
  const hrs = estimatedFixHours === 0 ? "under an hour" : estimatedFixHours === 1 ? "1 hour" : `${estimatedFixHours} hours`;
  return `${issueCount} issue${issueCount === 1 ? "" : "s"} detected. Estimated fix time: ${hrs}. Fix automatically with KDP PDF Formatter — coming soon at manu2print.com`;
}

export interface ChecklistSpecInput {
  trimMatchKDP?: boolean;
  trimDetected?: string;
  pageCount?: number;
  errorCount: number;
  warningCount: number;
  hasMarginIssues?: boolean;
  hasBleedIssues?: boolean;
  hasFontIssues?: boolean;
}

export function buildUploadChecklist(input: ChecklistSpecInput): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  items.push({
    check: "Trim size (KDP standard)",
    status: input.trimMatchKDP ? "pass" : (input.trimDetected ? "fail" : "warning"),
  });
  items.push({
    check: "Page count (24–828)",
    status: input.pageCount != null && input.pageCount >= 24 && input.pageCount <= 828 ? "pass" : input.pageCount != null ? "fail" : "warning",
  });
  items.push({
    check: "Margins & safe area",
    status: input.hasMarginIssues ? "fail" : "pass",
  });
  items.push({
    check: "Bleed (0.125\")",
    status: input.hasBleedIssues ? "fail" : "pass",
  });
  items.push({
    check: "Fonts embedded",
    status: input.hasFontIssues ? "fail" : "pass",
  });
  items.push({
    check: "No critical errors",
    status: input.errorCount === 0 ? "pass" : "fail",
  });
  items.push({
    check: "Warnings (optional fix)",
    status: input.warningCount === 0 ? "pass" : "warning",
  });
  return items;
}

export interface SpecTableInput {
  trimDetected?: string;
  trimMatchKDP?: boolean;
  kdpTrimName?: string | null;
  pageCount?: number;
  fileSizeMB?: number;
  recommendedGutterInches?: number;
  errorCount: number;
  warningCount: number;
  hasMarginIssues?: boolean;
  hasBleedIssues?: boolean;
  hasFontIssues?: boolean;
}

export function buildSpecTable(input: SpecTableInput): SpecRow[] {
  const rows: SpecRow[] = [];
  rows.push({
    requirement: "Trim size",
    yourFile: input.trimDetected ?? "—",
    kdpRequired: "Standard (e.g. 5×8, 6×9)",
    status: input.trimMatchKDP ? "pass" : (input.trimDetected ? "fail" : "warning"),
  });
  rows.push({
    requirement: "Page count",
    yourFile: input.pageCount != null ? String(input.pageCount) : "—",
    kdpRequired: "24–828",
    status: input.pageCount != null && input.pageCount >= 24 && input.pageCount <= 828 ? "pass" : input.pageCount != null ? "fail" : "warning",
  });
  rows.push({
    requirement: "Margins",
    yourFile: input.hasMarginIssues ? "Issue(s) found" : "OK",
    kdpRequired: "Min 0.5\" inner + gutter, 0.25\" others",
    status: input.hasMarginIssues ? "fail" : "pass",
  });
  rows.push({
    requirement: "Bleed",
    yourFile: input.hasBleedIssues ? "Issue(s) found" : "OK",
    kdpRequired: "0.125\"",
    status: input.hasBleedIssues ? "fail" : "pass",
  });
  rows.push({
    requirement: "Fonts",
    yourFile: input.hasFontIssues ? "Issue(s) found" : "OK",
    kdpRequired: "Embedded",
    status: input.hasFontIssues ? "fail" : "pass",
  });
  rows.push({
    requirement: "File size",
    yourFile: input.fileSizeMB != null ? `${input.fileSizeMB} MB` : "—",
    kdpRequired: "≤ 650 MB",
    status: input.fileSizeMB != null && input.fileSizeMB <= 650 ? "pass" : "warning",
  });
  return rows;
}

export function difficultyLabel(d: FixDifficulty): string {
  if (d === "easy") return "🟢 Easy fix (≈2 min)";
  if (d === "moderate") return "🟡 Moderate fix";
  return "🔴 Advanced fix";
}

/** Detect issue categories from preflight errors/warnings for checklist/spec. */
function detectIssueCategories(
  errors: Array<{ rule_id: string; message: string }>,
  warnings: Array<{ rule_id: string; message: string }>
): { hasMarginIssues: boolean; hasBleedIssues: boolean; hasFontIssues: boolean } {
  const all = [...errors, ...warnings];
  const combined = all.map((i) => `${i.rule_id} ${i.message}`.toLowerCase()).join(" ");
  return {
    hasMarginIssues: /margin|gutter|inner|outer|safe\s*area/.test(combined),
    hasBleedIssues: /bleed|trim\s*outside|crop/.test(combined),
    hasFontIssues: /font|embed|subset/.test(combined),
  };
}

export interface CheckerReportBase {
  outputType: "checker";
  issues: string[];
  pageCount?: number;
  trimDetected?: string;
  trimMatchKDP?: boolean;
  kdpTrimName?: string | null;
  fileSizeMB?: number;
  recommendedGutterInches?: number;
  page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
}

export interface EnrichedCheckerReport extends CheckerReportBase {
  scanDate: string;
  fileNameScanned: string;
  kdpPassProbability: number;
  riskLevel: "Low" | "Medium" | "High";
  issuesEnriched: EnrichedIssue[];
  uploadChecklist: ChecklistItem[];
  specTable: SpecRow[];
  estimatedFixHours: number;
  upsellBridge: string;
}

/** Enrich a checker report with score, human text, difficulty, checklist, spec table, upsell. */
export function enrichCheckerReport(
  report: CheckerReportBase,
  fileNameScanned: string,
  preflight?: {
    errors: Array<{ page: number; rule_id: string; severity: string; message: string }>;
    warnings: Array<{ page: number; rule_id: string; severity: string; message: string }>;
  }
): EnrichedCheckerReport {
  const errorCount = preflight ? preflight.errors.length : report.issues.length;
  const warningCount = preflight ? preflight.warnings.length : 0;
  const categories = preflight
    ? detectIssueCategories(preflight.errors, preflight.warnings)
    : { hasMarginIssues: false, hasBleedIssues: false, hasFontIssues: false };

  let issuesEnriched: EnrichedIssue[];
  if (preflight) {
    issuesEnriched = [
      ...preflight.errors.map((e) => enrichIssue(e.message, e.page, e.rule_id, e.severity)),
      ...preflight.warnings.map((w) => enrichIssue(w.message, w.page, w.rule_id, w.severity)),
    ];
  } else {
    issuesEnriched = report.issues.map((msg) => ({
      originalMessage: msg,
      humanMessage: toHumanMessage(msg),
      fixDifficulty: toFixDifficulty("", msg),
      page: undefined,
      rule_id: "",
      severity: "error",
    }));
  }

  const score = computeKdpPassProbability(errorCount, warningCount);
  const riskLevel = getRiskLevel(score);
  const uploadChecklist = buildUploadChecklist({
    trimMatchKDP: report.trimMatchKDP,
    trimDetected: report.trimDetected,
    pageCount: report.pageCount,
    errorCount,
    warningCount,
    ...categories,
  });
  const specTable = buildSpecTable({
    trimDetected: report.trimDetected,
    trimMatchKDP: report.trimMatchKDP,
    kdpTrimName: report.kdpTrimName,
    pageCount: report.pageCount,
    fileSizeMB: report.fileSizeMB,
    recommendedGutterInches: report.recommendedGutterInches,
    errorCount,
    warningCount,
    ...categories,
  });
  const estimatedFixHours = estimateFixHours(issuesEnriched);
  const issueCount = issuesEnriched.length;
  const upsellBridge = buildUpsellBridge(issueCount, estimatedFixHours);

  return {
    ...report,
    scanDate: new Date().toISOString(),
    fileNameScanned: fileNameScanned || "document.pdf",
    kdpPassProbability: score,
    riskLevel,
    issuesEnriched,
    uploadChecklist,
    specTable,
    estimatedFixHours,
    upsellBridge,
  };
}
