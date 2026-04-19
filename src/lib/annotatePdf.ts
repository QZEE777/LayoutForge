/**
 * manu2print — KDP PDF Annotation Engine
 *
 * Implements a professional print-preflight annotation system:
 *   1. Governing geometry guides  — trim boundary + KDP safe text area
 *   2. Numbered issue markers     — small circles + thin dashed bbox outlines
 *   3. Per-page legend panel      — rule ID, message, severity, expected/observed
 *
 * Scope: annotation mapping, rendering, styling only.
 * Detection logic, scoring, database, payment flow — untouched.
 */

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import { getStored, updateAnnotatedState, updateMeta } from "@/lib/storage";
import { getFileByKey, uploadFile, getSignedDownloadUrl } from "@/lib/r2Storage";
import { supabase } from "@/lib/supabase";

// ── Type definitions ───────────────────────────────────────────────────────────

type PageIssue = {
  page: number;
  severity?: string;
  rule_id?: string;
  message?: string;
  bbox?: number[] | null;
};

type EnrichedIssue = {
  page?: number;
  severity?: string;
  rule_id?: string;
  humanMessage?: string;
};

type AnnotationSeverity = "fail" | "warning" | "info";

type AnnotationIssue = {
  page: number;
  severity: AnnotationSeverity;
  ruleId: string;
  message: string;
  bbox: number[] | null; // [x, y, w, h] in PDF points, bottom-left origin
  affectedPages?: number[]; // populated by aggregateIssues(); length > 1 means repeated rule
};

// ── Constants ──────────────────────────────────────────────────────────────────

const PT = 72; // points per inch

// KDP margin requirements
const OUTER_MARGIN_PT      = 0.25 * PT; // 18pt  — KDP min outer margin
const TOP_BOTTOM_MARGIN_PT = 0.50 * PT; // 36pt  — KDP min top/bottom margin

// Annotation engine version — bump when aggregation or rendering logic changes.
// Cached PDFs with a different version are re-annotated automatically.
const ANNOTATION_VERSION = "v7";

// Annotation caps
const MAX_ANNOTATIONS_TOTAL = 30;
const MAX_LEGEND_ITEMS      = 4;   // max issues shown per page legend
const MAX_BOXES_PER_PAGE    = 3;   // max violation boxes drawn on any one page

// Legend geometry
const LEGEND_PADDING      = 10; // pt top/bottom padding inside legend panel
const LEGEND_HEADER_H     = 14; // pt for "PAGE N — ISSUE LEGEND" header row
const LEGEND_ROW_H        = 22; // pt per issue row — increased for breathing room
const LEGEND_OVERFLOW_H   = 12; // pt for "+ N more" overflow note

// Document-level header panel (page 1 only)
const DOC_HEADER_PADDING = 8;  // pt top/bottom padding
const DOC_HEADER_TITLE_H = 14; // pt for title row
const DOC_HEADER_ROW_H   = 16; // pt per global-issue row

// Marker geometry
const MARKER_RADIUS = 5; // pt — numbered circle radius

// ── Color system ───────────────────────────────────────────────────────────────

const COLOR = {
  // Severity — muted, professional
  fail:    rgb(0.62, 0.22, 0.22), // muted dusty red
  warning: rgb(0.75, 0.48, 0.06), // soft amber
  info:    rgb(0.28, 0.43, 0.63), // neutral blue-gray

  // Geometry guides — restrained, semi-transparent
  trim: rgb(0.42, 0.42, 0.42), // medium gray
  safe: rgb(0.28, 0.40, 0.60), // blue-gray

  // Legend UI
  legendBg:     rgb(0.97, 0.97, 0.96),
  legendBorder: rgb(0.72, 0.72, 0.72),
  legendHeader: rgb(0.30, 0.30, 0.30),
  legendText:   rgb(0.22, 0.22, 0.22),
  legendMuted:  rgb(0.52, 0.52, 0.52),
  markerText:   rgb(1.00, 1.00, 1.00),
} as const;

// ── KDP geometry helpers ───────────────────────────────────────────────────────

/** KDP gutter (inner margin) based on page count — from KDP's official table. */
function getGutterPt(pageCount: number): number {
  if (pageCount <= 150) return 0.375 * PT; // 27pt
  if (pageCount <= 300) return 0.500 * PT; // 36pt
  if (pageCount <= 500) return 0.625 * PT; // 45pt
  if (pageCount <= 700) return 0.750 * PT; // 54pt
  return 0.875 * PT;                       // 63pt
}

// ── Severity helpers ───────────────────────────────────────────────────────────

function normalizeSeverity(raw?: string): AnnotationSeverity {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "blocker" || s === "fail") return "fail";
  if (s === "critical" || s === "error" || s === "warning") return "warning";
  return "info";
}

function isAnnotatable(raw?: string): boolean {
  const s = String(raw ?? "").toLowerCase().trim();
  return s !== "" && s !== "info";
}

function severityLabel(s: AnnotationSeverity): string {
  if (s === "fail")    return "FAIL";
  if (s === "warning") return "WARNING";
  return "INFO";
}

function severityColor(s: AnnotationSeverity) {
  return COLOR[s];
}

function severityRank(s: AnnotationSeverity): number {
  if (s === "fail")    return 0;
  if (s === "warning") return 1;
  return 2;
}

// ── Human-readable labels and sentences ───────────────────────────────────────

const RULE_LABELS: Record<string, string> = {
  ALLOWED_TRIM_SIZES:          "Wrong Trim Size",
  CONSISTENT_TRIM:             "Inconsistent Page Sizes",
  MIXED_PAGE_SIZES:            "Mixed Page Sizes",
  MIN_PAGE_COUNT:              "Too Few Pages",
  MAX_PAGE_COUNT:              "Too Many Pages",
  ODD_PAGE_COUNT:              "Odd Page Count",
  KDP_TRIM_PROFILE:            "Trim Profile Mismatch",
  TRIM_PROFILE:                "Trim Profile Mismatch",
  TRIM_BOX:                    "Trim Box Missing",
  HARDCOVER_TRIM_SIZE:         "Hardcover Size Not Supported",
  BLEED_VALIDATION:            "Missing Bleed",
  IMAGE_BLEED:                 "Image Does Not Reach Bleed",
  GUTTER_MARGIN:               "Gutter Too Narrow",
  OUTSIDE_MARGIN_MIN:          "Outer Margin Too Narrow",
  TOP_MARGIN_MIN:              "Top Margin Too Narrow",
  BOTTOM_MARGIN_MIN:           "Bottom Margin Too Narrow",
  SAFE_ZONE:                   "Content in Unsafe Area",
  TEXT_OUTSIDE_TRIM:           "Text Outside Trim Area",
  EMBEDDED_FONTS:              "Fonts Not Embedded",
  RESTRICTED_FONT_EMBEDDING:   "Font Cannot Be Embedded",
  MIN_FONT_SIZE:               "Text Too Small",
  COLOR_PROFILE:               "Color Profile Issue",
  OUTPUT_INTENT:               "Color Output Not Specified",
  TRANSPARENCY_FLATTENING:     "Transparency Not Flattened",
  PDF_VERSION:                 "Unsupported PDF Version",
  ROTATED_PAGES:               "Rotated Pages",
  EMPTY_PAGE:                  "Blank Page",
  ORIENTATION_CONSISTENCY:     "Inconsistent Page Orientation",
  FILE_SIZE:                   "File Too Large",
};

const RULE_SENTENCES: Record<string, string> = {
  ALLOWED_TRIM_SIZES:          "Trim size is not on KDP's approved list - KDP will reject this file.",
  CONSISTENT_TRIM:             "Pages have different sizes - KDP requires all pages to match exactly.",
  MIXED_PAGE_SIZES:            "Pages have different sizes - KDP requires all pages to match exactly.",
  MIN_PAGE_COUNT:              "Not enough pages - KDP will reject files with fewer than 24 pages.",
  MAX_PAGE_COUNT:              "Too many pages for this trim size - KDP will reject this file.",
  ODD_PAGE_COUNT:              "Page count is odd - KDP will add a blank page to the end.",
  KDP_TRIM_PROFILE:            "Trim box does not match the declared page size - pages will be cut incorrectly.",
  TRIM_PROFILE:                "Trim box does not match the declared page size - pages will be cut incorrectly.",
  TRIM_BOX:                    "PDF trim box is missing - KDP cannot determine where to cut the pages.",
  HARDCOVER_TRIM_SIZE:         "This size is not supported for hardcover - KDP will reject this file.",
  BLEED_VALIDATION:            "No bleed area found - a white border will appear on the printed edge.",
  IMAGE_BLEED:                 "Image does not reach the bleed edge - a white gap will appear after trimming.",
  GUTTER_MARGIN:               "Gutter is too narrow - text near the spine will be lost in the binding.",
  OUTSIDE_MARGIN_MIN:          "Outer margin is too narrow - content will be cut during printing.",
  TOP_MARGIN_MIN:              "Top margin is too narrow - content will be cut at the top of the page.",
  BOTTOM_MARGIN_MIN:           "Bottom margin is too narrow - content will be cut at the bottom of the page.",
  SAFE_ZONE:                   "Content is too close to the edge - it will be cut during printing.",
  TEXT_OUTSIDE_TRIM:           "Text sits outside the trim area - it will not appear in the printed book.",
  EMBEDDED_FONTS:              "Fonts are not embedded - KDP will replace them with a default font, breaking your layout.",
  RESTRICTED_FONT_EMBEDDING:   "A font in this file blocks embedding - text will display incorrectly in the printed book.",
  MIN_FONT_SIZE:               "Text is too small to print - readers will not be able to read it.",
  COLOR_PROFILE:               "No color profile detected - printed colors will differ from what you see on screen.",
  OUTPUT_INTENT:               "Color output intent is missing - KDP cannot guarantee accurate print colors.",
  TRANSPARENCY_FLATTENING:     "Transparent elements were not flattened - overlapping content will not print correctly.",
  PDF_VERSION:                 "PDF version is not supported - re-export at PDF 1.3 or higher.",
  ROTATED_PAGES:               "Some pages are rotated - they will print sideways.",
  EMPTY_PAGE:                  "This page appears blank - verify this is intentional before uploading.",
  ORIENTATION_CONSISTENCY:     "Page orientations are inconsistent - KDP requires a uniform orientation.",
  FILE_SIZE:                   "File exceeds KDP's 650MB limit - compress images or reduce resolution.",
};

function getIssueLabel(ruleId: string): string {
  return RULE_LABELS[ruleId] ?? ruleId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function getIssueSentence(ruleId: string, fallback: string): string {
  return RULE_SENTENCES[ruleId] ?? fallback;
}

function getDocumentStatus(issues: AnnotationIssue[]): "fail" | "warning" | "pass" {
  if (issues.some(i => i.severity === "fail"))    return "fail";
  if (issues.some(i => i.severity === "warning")) return "warning";
  return "pass";
}

function statusDisplay(status: "fail" | "warning" | "pass"): {
  heading:  string;
  subtitle: string;
  color:    ReturnType<typeof rgb>;
} {
  if (status === "fail")    return {
    heading:  "[X] WILL FAIL KDP REVIEW",
    subtitle: "Fix these issues before uploading to avoid rejection.",
    color:    COLOR.fail,
  };
  if (status === "warning") return {
    heading:  "[!] WILL CAUSE PRINT ISSUES",
    subtitle: "Fix these issues before uploading to avoid printing errors.",
    color:    COLOR.warning,
  };
  return {
    heading:  "[OK] READY FOR UPLOAD",
    subtitle: "Your file meets KDP requirements. You are ready to upload.",
    color:    rgb(0.18, 0.55, 0.22),
  };
}

// ── Message parsing ────────────────────────────────────────────────────────────

/**
 * Attempts to extract expected/observed values from a message string.
 * Examples: "Required: 0.25 in, Observed: 0.14 in"
 *           "Minimum: 300 dpi (found: 72 dpi)"
 */
function parseValues(msg: string): { expected?: string; observed?: string } {
  const expMatch = msg.match(/(?:required|expected|minimum|min)[:\s]+([^,;.\n(]+)/i);
  const obsMatch = msg.match(/(?:observed|actual|detected|found|measured)[:\s]+([^,;.\n)]+)/i);
  return {
    expected: expMatch?.[1]?.trim(),
    observed: obsMatch?.[1]?.trim(),
  };
}

// ── Page range formatting ──────────────────────────────────────────────────────

/**
 * Converts a sorted array of page numbers into a compact human-readable range string.
 * Examples:  [3]        → "p. 3"
 *            [1, 2, 3]  → "pp. 1–3"
 *            [1, 3, 5]  → "pp. 1, 3, 5"
 *            [1..20]    → "pp. 1–20  (20×)"   (collapses with count when >6 pages)
 */
function formatPageRange(pages: number[]): string {
  if (pages.length === 0) return "";
  if (pages.length === 1) return `p. ${pages[0]}`;

  const runs: string[] = [];
  let start = pages[0];
  let prev  = pages[0];

  for (let i = 1; i < pages.length; i++) {
    if (pages[i] === prev + 1) {
      prev = pages[i];
    } else {
      runs.push(start === prev ? String(start) : `${start}–${prev}`);
      start = pages[i];
      prev  = pages[i];
    }
  }
  runs.push(start === prev ? String(start) : `${start}–${prev}`);

  const rangeStr = runs.join(", ");
  return pages.length > 6
    ? `pp. ${rangeStr}  (${pages.length}×)`
    : `pp. ${rangeStr}`;
}

// ── Issue normalization ────────────────────────────────────────────────────────

function normalizeIssues(
  pageIssues: PageIssue[],
  enrichedIssues: EnrichedIssue[],
  pageCount: number,
): AnnotationIssue[] {
  const out: AnnotationIssue[] = [];

  for (const issue of pageIssues) {
    if (!isAnnotatable(issue.severity)) continue;
    const page = Number(issue.page);
    if (!Number.isFinite(page) || page < 1 || page > pageCount) continue;
    out.push({
      page,
      severity: normalizeSeverity(issue.severity),
      ruleId:   String(issue.rule_id ?? "ISSUE").toUpperCase().trim() || "ISSUE",
      message:  issue.message?.trim() || "Formatting issue detected",
      bbox:     Array.isArray(issue.bbox) && issue.bbox.length >= 4 ? issue.bbox : null,
    });
  }

  // Fallback: enriched issues when page_issues has no annotatable entries
  if (out.length === 0) {
    for (const issue of enrichedIssues) {
      if (!isAnnotatable(issue.severity)) continue;
      const page = Number(issue.page);
      if (!Number.isFinite(page) || page < 1 || page > pageCount) continue;
      out.push({
        page,
        severity: normalizeSeverity(issue.severity),
        ruleId:   String(issue.rule_id ?? "ISSUE").toUpperCase().trim() || "ISSUE",
        message:  issue.humanMessage?.trim() || "Formatting issue detected",
        bbox:     null,
      });
    }
  }

  return out;
}

// ── Issue aggregation (deduplication) ─────────────────────────────────────────

/**
 * Returns the union bounding box of all supplied [x, y, w, h] rectangles.
 */
function mergeBboxes(boxes: number[][]): [number, number, number, number] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const b of boxes) {
    const bx = Number(b[0]) || 0;
    const by = Number(b[1]) || 0;
    const bw = Number(b[2]) || 0;
    const bh = Number(b[3]) || 0;
    minX = Math.min(minX, bx);
    minY = Math.min(minY, by);
    maxX = Math.max(maxX, bx + bw);
    maxY = Math.max(maxY, by + bh);
  }
  return [minX, minY, maxX - minX, maxY - minY];
}

/**
 * Builds a stable, canonical aggregation key for an issue.
 *
 * Per-page rules: key = ruleId + full normalised message (exact match required).
 *
 * Document-level rules (trim profile, page count, file size, etc.):
 *   The external preflight engine often fires these rules once per page and
 *   embeds the page number in the message — e.g.
 *     "Page 1 trim size (6×9 in) is not in KDP's allowed list."
 *     "Page 2 trim size (6×9 in) is not in KDP's allowed list."
 *   Without a canonical key these land in 20 separate groups.
 *
 *   Strategy (applied only for document-level rules):
 *   1. If the message contains a dimension (W × H), round to 0.01 in and use
 *      `ruleId::WxH` — absorbs page-number prefixes AND floating-point noise.
 *   2. Otherwise, strip page-number references then normalise whitespace.
 */
function buildAggregationKey(issue: AnnotationIssue): string {
  const { ruleId, message } = issue;

  // Document-level rules (trim size, page count, colour profile, etc.) fire once
  // per page but describe a document-wide condition. Key on ruleId only — message
  // content is irrelevant and varies across pages (floating-point dimensions,
  // embedded page numbers), which would otherwise produce 20 separate groups
  // instead of one.
  if (isDocumentLevelRule(ruleId, message)) {
    return `doc::${ruleId}`;
  }

  // Per-page rules: key = ruleId + normalised message.
  return `${ruleId}::${message.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

/**
 * Collapses issues into one entry per (ruleId × page) for per-page rules,
 * or one entry per ruleId for document-level rules.
 *
 * Per-page: all bboxes for the same rule on the same page are merged into a
 * single union rectangle — prevents dozens of overlapping boxes (e.g. one per
 * text line for SAFE_ZONE) from appearing on a single page.
 *
 * Document-level: keyed on ruleId only; all affected pages are collected.
 *
 * The `affectedPages` field lists all pages where the rule fired so legend
 * and header panels can display a page range.
 */
function aggregateIssues(issues: AnnotationIssue[]): AnnotationIssue[] {
  type DocGroup  = { pages: Set<number>; best: AnnotationIssue };
  type PageGroup = { pages: Set<number>; bboxes: number[][]; best: AnnotationIssue };

  const docGroups  = new Map<string, DocGroup>();
  const pageGroups = new Map<string, PageGroup>();

  for (const issue of issues) {
    if (isDocumentLevelRule(issue.ruleId, issue.message)) {
      const key   = `doc::${issue.ruleId}`;
      const group = docGroups.get(key);
      if (!group) {
        docGroups.set(key, { pages: new Set([issue.page]), best: { ...issue } });
      } else {
        group.pages.add(issue.page);
        const nr = severityRank(issue.severity);
        const cr = severityRank(group.best.severity);
        if (nr < cr || (nr === cr && issue.bbox && !group.best.bbox)) {
          group.best = { ...issue };
        }
      }
    } else {
      // Group per-page issues by (ruleId, page) — merge all their bboxes
      const key   = `${issue.ruleId}::p${issue.page}`;
      const group = pageGroups.get(key);
      if (!group) {
        pageGroups.set(key, {
          pages:  new Set([issue.page]),
          bboxes: issue.bbox ? [issue.bbox] : [],
          best:   { ...issue },
        });
      } else {
        group.pages.add(issue.page);
        if (issue.bbox) group.bboxes.push(issue.bbox);
        const nr = severityRank(issue.severity);
        const cr = severityRank(group.best.severity);
        if (nr < cr) group.best = { ...issue };
      }
    }
  }

  const result: AnnotationIssue[] = [];

  for (const { pages, best } of docGroups.values()) {
    result.push({ ...best, affectedPages: [...pages].sort((a, b) => a - b) });
  }

  for (const { pages, bboxes, best } of pageGroups.values()) {
    result.push({
      ...best,
      bbox:          bboxes.length > 0 ? mergeBboxes(bboxes) : best.bbox,
      affectedPages: [...pages].sort((a, b) => a - b),
    });
  }

  return result;
}

// ── Geometry overlay ───────────────────────────────────────────────────────────

/**
 * Draws governing geometry guides on a page — applied to ALL pages.
 *
 * Two visually distinct boundaries:
 *   - Trim boundary: solid gray hairline 1pt inside page edge
 *   - Safe text area: solid blue-gray box at KDP required margins (gutter-aware)
 *
 * No text labels. Guides are thin and consistent.
 */
function drawGoverningGeometry(
  page:      PDFPage,
  pageNumber: number,
  pageCount:  number,
): void {
  const { width, height } = page.getSize();
  const gutter      = getGutterPt(pageCount);
  const isRightPage = pageNumber % 2 === 1; // odd = right page, gutter on left

  const marginLeft  = isRightPage ? gutter         : OUTER_MARGIN_PT;
  const marginRight = isRightPage ? OUTER_MARGIN_PT : gutter;

  // ── 1. Trim boundary: solid hairline, slightly stronger — primary reference line
  page.drawRectangle({
    x: 1, y: 1,
    width:  width  - 2,
    height: height - 2,
    borderColor:   COLOR.trim,
    borderWidth:   0.5,
    borderOpacity: 0.65,
    // Solid — no dash. Visually dominant over safe-area dashes below.
  });

  // ── 2. Safe text area: lighter dashed box — secondary reference, recedes behind trim
  const safeX = marginLeft;
  const safeY = TOP_BOTTOM_MARGIN_PT;
  const safeW = width  - marginLeft - marginRight;
  const safeH = height - TOP_BOTTOM_MARGIN_PT * 2;

  page.drawRectangle({
    x: safeX, y: safeY,
    width:  safeW,
    height: safeH,
    borderColor:     COLOR.safe,
    borderWidth:     0.4,
    borderOpacity:   0.30,
    borderDashArray: [5, 4],
    borderDashPhase: 0,
  });
}

// ── Legend panel ───────────────────────────────────────────────────────────────

function getLegendHeight(issueCount: number): number {
  const shown    = Math.min(issueCount, MAX_LEGEND_ITEMS);
  const overflow = issueCount > MAX_LEGEND_ITEMS ? LEGEND_OVERFLOW_H : 0;
  return LEGEND_PADDING + LEGEND_HEADER_H + shown * LEGEND_ROW_H + overflow + LEGEND_PADDING;
}

/**
 * Draws a structured legend panel at the bottom of the page.
 * Format per row:  [①] RULE-ID   message truncated   SEVERITY
 *                       Required: X  ·  Observed: Y
 */
function drawLegendPanel(
  page:      PDFPage,
  issues:    AnnotationIssue[],
  pageNum:   number,
  font:      PDFFont,
  boldFont:  PDFFont,
): void {
  const { width } = page.getSize();
  const shown    = issues.slice(0, MAX_LEGEND_ITEMS);
  const overflow = issues.length - shown.length;
  const lh       = getLegendHeight(issues.length);

  // ── Panel background
  page.drawRectangle({
    x: 0, y: 0,
    width,
    height:        lh,
    color:         COLOR.legendBg,
    opacity:       0.92,
    borderColor:   COLOR.legendBorder,
    borderWidth:   0.4,
  });

  // ── Top separator line
  page.drawLine({
    start: { x: 0, y: lh },
    end:   { x: width, y: lh },
    color:     COLOR.legendBorder,
    thickness: 0.5,
    opacity:   0.65,
  });

  // ── Header
  const headerY = lh - LEGEND_PADDING - LEGEND_HEADER_H + 4;
  page.drawText(`PAGE ${pageNum}  —  ISSUE LEGEND`, {
    x:       LEGEND_PADDING,
    y:       headerY,
    size:    6.0,
    font:    boldFont,
    color:   COLOR.legendHeader,
    opacity: 0.90,
  });

  // Severity column header removed — color of each row dot communicates severity

  // ── Issue rows
  shown.forEach((issue, i) => {
    const rowTop = lh - LEGEND_PADDING - LEGEND_HEADER_H - i * LEGEND_ROW_H;
    const line1Y = rowTop - 8;
    const line2Y = rowTop - 16;

    const col        = severityColor(issue.severity);
    const numStr     = String(i + 1);
    const numW       = font.widthOfTextAtSize(numStr, 6);
    const circleX    = LEGEND_PADDING + MARKER_RADIUS;
    const circleY    = (line1Y + line2Y) / 2 + 1;

    // Severity-colored circle
    page.drawEllipse({
      x: circleX, y: circleY,
      xScale: MARKER_RADIUS - 0.5,
      yScale: MARKER_RADIUS - 0.5,
      color:   col,
      opacity: 0.88,
    });

    // Issue number
    page.drawText(numStr, {
      x:       circleX - numW / 2,
      y:       circleY - 2.5,
      size:    6,
      font,
      color:   COLOR.markerText,
      opacity: 1,
    });

    // Text column starts after circle
    const textX = LEGEND_PADDING + MARKER_RADIUS * 2 + 5;

    // Human-readable label (bold) — line 1 left; fail items slightly larger for hierarchy
    const ruleLabel  = getIssueLabel(issue.ruleId);
    const labelSize  = issue.severity === "fail" ? 6.5 : 6.0;
    page.drawText(ruleLabel, {
      x:       textX,
      y:       line1Y,
      size:    labelSize,
      font:    boldFont,
      color:   COLOR.legendText,
      opacity: 0.92,
    });

    // Severity tag — de-emphasised, right-aligned, communicates type without dominating
    const sevLabel = severityLabel(issue.severity);
    const sevW     = font.widthOfTextAtSize(sevLabel, 4.5);
    page.drawText(sevLabel, {
      x:       width - LEGEND_PADDING - sevW,
      y:       line1Y,
      size:    4.5,
      font,
      color:   COLOR.legendMuted,
      opacity: 0.35,
    });

    // One-sentence description — line 2
    const rawSentence = getIssueSentence(issue.ruleId, issue.message);
    const maxChars    = Math.max(20, Math.floor((width - textX - 50) / 3.8));
    const line2Text   = rawSentence.length > maxChars
      ? rawSentence.slice(0, maxChars - 1) + "…"
      : rawSentence;

    page.drawText(line2Text, {
      x:       textX,
      y:       line2Y,
      size:    5.5,
      font,
      color:   COLOR.legendMuted,
      opacity: 0.85,
    });
  });

  // ── Overflow note
  if (overflow > 0) {
    page.drawText(`+ ${overflow} more issue${overflow > 1 ? "s" : ""} - see full report`, {
      x:       LEGEND_PADDING,
      y:       LEGEND_PADDING - 1,
      size:    5,
      font,
      color:   COLOR.legendMuted,
      opacity: 0.75,
    });
  }
}

// ── Spatial violation region derivation ───────────────────────────────────────

/**
 * For page-level spatial violations (no bbox from scanner), derives the
 * bounding region from KDP geometry and the rule/message content.
 * Returns [x, y, w, h] in PDF points, or null if not derivable.
 */
function deriveViolationBbox(
  ruleId:    string,
  message:   string,
  pw:        number,
  ph:        number,
  pageNum:   number,
  pageCount: number,
): [number, number, number, number] | null {
  const text     = `${ruleId} ${message}`.toLowerCase();
  const gutter   = getGutterPt(pageCount);
  const isRight  = pageNum % 2 === 1; // odd = right page

  // Gutter / inner margin
  if (/gutter|inner.?margin/.test(text)) {
    const x = isRight ? 0 : pw - gutter;
    return [x, 0, gutter, ph];
  }

  // Outer / side margin
  if (/outer.?margin|outside.?margin|side.?margin/.test(text)) {
    const x = isRight ? pw - OUTER_MARGIN_PT : 0;
    return [x, 0, OUTER_MARGIN_PT, ph];
  }

  // Top margin / header
  if (/top.?margin|header/.test(text)) {
    return [0, ph - TOP_BOTTOM_MARGIN_PT, pw, TOP_BOTTOM_MARGIN_PT];
  }

  // Bottom margin / footer
  if (/bottom.?margin|footer/.test(text)) {
    return [0, 0, pw, TOP_BOTTOM_MARGIN_PT];
  }

  // Generic margin — highlight outer band
  if (/margin/.test(text)) {
    const x = isRight ? pw - OUTER_MARGIN_PT : 0;
    return [x, 0, OUTER_MARGIN_PT, ph];
  }

  // Bleed — top strip
  if (/bleed/.test(text)) {
    return [0, ph - 9, pw, 9]; // 9pt = 0.125 in bleed strip
  }

  // Safe area / live area / content area
  if (/safe.?area|live.?area|content.?area/.test(text)) {
    const left  = isRight ? gutter         : OUTER_MARGIN_PT;
    const right = isRight ? OUTER_MARGIN_PT : gutter;
    return [left, TOP_BOTTOM_MARGIN_PT, pw - left - right, ph - TOP_BOTTOM_MARGIN_PT * 2];
  }

  return null;
}

// ── Document-level rule detection ─────────────────────────────────────────────

/**
 * Returns true for rules that apply to the document as a whole, not a specific
 * page location (page count, trim profile, file size, colour profile, etc.).
 * These are pulled out of the per-page annotation loop and shown only in the
 * page-1 header panel.
 */
function isDocumentLevelRule(ruleId: string, message: string): boolean {
  const text = `${ruleId} ${message}`.toLowerCase();
  return /page.?count|min.?page|max.?page|trim.?profile|trim.?size|trim.?match|file.?size|color.?profile|color.?space|colour.?profile|colour.?space|document.?level|global|icc.?profile|output.?intent/.test(text.replace(/\s+/g, ""));
}

// ── Status banner (page 1 only) ────────────────────────────────────────────────

const STATUS_BANNER_H = 26; // pt — two-line colored strip (heading + subtitle)
const BANNER_GAP      =  2; // pt — breathing room between banner and header panel

/**
 * Draws a compact one-line status strip at the very top of page 1.
 * Color encodes severity: red = will fail, amber = print issues, green = ready.
 */
function drawStatusBanner(
  page:     PDFPage,
  status:   "fail" | "warning" | "pass",
  font:     PDFFont,
  boldFont: PDFFont,
): void {
  const { width, height }          = page.getSize();
  const { heading, subtitle, color } = statusDisplay(status);

  page.drawRectangle({
    x: 0, y: height - STATUS_BANNER_H,
    width, height: STATUS_BANNER_H,
    color,
    opacity: 0.90,
  });

  // Line 1 — main status heading (bold, centered)
  const headingW = boldFont.widthOfTextAtSize(heading, 6.5);
  page.drawText(heading, {
    x:       (width - headingW) / 2,
    y:       height - 10,
    size:    6.5,
    font:    boldFont,
    color:   rgb(1, 1, 1),
    opacity: 1,
  });

  // Line 2 — subtitle (normal weight, centered, slightly smaller)
  const subtitleW = font.widthOfTextAtSize(subtitle, 5.0);
  page.drawText(subtitle, {
    x:       (width - subtitleW) / 2,
    y:       height - STATUS_BANNER_H + 5,
    size:    5.0,
    font,
    color:   rgb(1, 1, 1),
    opacity: 0.85,
  });
}

// ── Document-level header panel (page 1 only) ──────────────────────────────────

/**
 * Draws a compact header panel at the top of page 1 for document-level issues.
 * topOffset should equal STATUS_BANNER_H when a status banner has already been
 * drawn so the panel starts immediately below it.
 */
function drawDocumentHeaderPanel(
  page:      PDFPage,
  issues:    AnnotationIssue[],
  font:      PDFFont,
  boldFont:  PDFFont,
  topOffset: number = 0,
): void {
  const { width, height } = page.getSize();
  const ph = DOC_HEADER_PADDING + DOC_HEADER_TITLE_H + issues.length * DOC_HEADER_ROW_H + DOC_HEADER_PADDING;
  const panelY = height - topOffset - ph; // bottom y-coordinate of panel

  // Panel background
  page.drawRectangle({
    x: 0, y: panelY,
    width, height: ph,
    color:       COLOR.legendBg,
    opacity:     0.93,
    borderColor: COLOR.legendBorder,
    borderWidth: 0.4,
  });

  // Bottom separator
  page.drawLine({
    start: { x: 0, y: panelY },
    end:   { x: width, y: panelY },
    color: COLOR.legendBorder, thickness: 0.5, opacity: 0.65,
  });

  // Title + column header
  const titleY = height - topOffset - DOC_HEADER_PADDING - DOC_HEADER_TITLE_H + 4;
  page.drawText("DOCUMENT-WIDE ISSUES", {
    x: LEGEND_PADDING, y: titleY,
    size: 6.0, font: boldFont, color: COLOR.legendHeader, opacity: 0.90,
  });
  // Severity column header removed — dot color communicates severity

  // Issue rows
  issues.forEach((issue, i) => {
    const rowMidY = height - topOffset - DOC_HEADER_PADDING - DOC_HEADER_TITLE_H - i * DOC_HEADER_ROW_H - DOC_HEADER_ROW_H / 2;
    const textY   = rowMidY - 2;
    const col     = severityColor(issue.severity);

    // Severity dot
    page.drawEllipse({
      x: LEGEND_PADDING + MARKER_RADIUS - 1, y: rowMidY,
      xScale: MARKER_RADIUS - 1.5, yScale: MARKER_RADIUS - 1.5,
      color: col, opacity: 0.85,
    });

    const textX      = LEGEND_PADDING + MARKER_RADIUS * 2 + 3;
    const ruleLabel  = getIssueLabel(issue.ruleId);
    const labelSize  = issue.severity === "fail" ? 6.5 : 6.0;
    const ruleLabelW = boldFont.widthOfTextAtSize(ruleLabel, labelSize);

    // Human-readable label; fail items slightly larger for visual hierarchy
    page.drawText(ruleLabel, {
      x: textX, y: textY,
      size: labelSize, font: boldFont, color: COLOR.legendText, opacity: 0.90,
    });

    // One-sentence description
    const msgX     = textX + ruleLabelW + 6;
    const maxChars = Math.max(10, Math.floor((width - msgX - 65) / 3.8));
    const sentence = getIssueSentence(issue.ruleId, issue.message);
    const msgStr   = sentence.length > maxChars
      ? sentence.slice(0, maxChars - 1) + "…"
      : sentence;
    page.drawText(msgStr, {
      x: msgX, y: textY,
      size: 5.5, font, color: COLOR.legendMuted, opacity: 0.85,
    });

    // Severity tag — de-emphasised
    const sevLabel = severityLabel(issue.severity);
    const sevW     = font.widthOfTextAtSize(sevLabel, 4.5);
    page.drawText(sevLabel, {
      x: width - LEGEND_PADDING - sevW, y: textY,
      size: 4.5, font, color: COLOR.legendMuted, opacity: 0.35,
    });
  });
}

// ── Marker helper ──────────────────────────────────────────────────────────────

/** Draws a severity-colored filled circle with a white issue number inside. */
function drawNumberedCircle(
  page:   PDFPage,
  cx:     number,
  cy:     number,
  col:    ReturnType<typeof rgb>,
  num:    string,
  font:   PDFFont,
): void {
  page.drawEllipse({
    x: cx, y: cy,
    xScale: MARKER_RADIUS,
    yScale: MARKER_RADIUS,
    color:   col,
    opacity: 0.92,
  });
  const nw = font.widthOfTextAtSize(num, 6);
  page.drawText(num, {
    x: cx - nw / 2, y: cy - 2.5,
    size: 6, font, color: COLOR.markerText, opacity: 1,
  });
}

// ── Issue markers on page ──────────────────────────────────────────────────────

/**
 * Draws violation boxes and numbered markers on the page.
 *
 * Rules:
 *   - Only FAIL-severity issues get a visual box. WARNING issues appear in the
 *     legend only — no box, no marker on the page.
 *   - At most MAX_BOXES_PER_PAGE boxes are drawn. Candidates are sorted by
 *     bounding-box area (largest / most representative first).
 *   - Overlapping boxes are suppressed: if a candidate shares >50% of its area
 *     with an already-selected box, it is dropped.
 *   - Non-spatial FAIL issues (no derivable region) get a small marker circle
 *     at the top of the safe area — no box.
 */
function drawIssueMarkersOnPage(
  page:      PDFPage,
  issues:    AnnotationIssue[],
  legendH:   number,
  pageNum:   number,
  pageCount: number,
  font:      PDFFont,
): void {
  const { width, height } = page.getSize();
  const shown = issues.slice(0, MAX_LEGEND_ITEMS);

  const gutter   = getGutterPt(pageCount);
  const isRight  = pageNum % 2 === 1;
  const safeLeft = isRight ? gutter : OUTER_MARGIN_PT;
  let nonSpatialX = safeLeft + MARKER_RADIUS + 2;
  let nonSpatialY = height - TOP_BOTTOM_MARGIN_PT - MARKER_RADIUS - 2;

  type Candidate = {
    issue:  AnnotationIssue;
    legIdx: number;     // position in legend (1-based label)
    bx: number; by: number; bw: number; bh: number;
    area: number;
  };
  const spatial:    Candidate[] = [];
  const nonSpatial: Array<{ issue: AnnotationIssue; legIdx: number }> = [];

  shown.forEach((issue, i) => {
    // WARNING and INFO → legend only, no page mark
    if (issue.severity !== "fail") return;

    let bx = 0, by = 0, bw = 0, bh = 0;
    let hasBbox = false;

    if (issue.bbox) {
      bx = Math.max(0,       Number(issue.bbox[0]) || 0);
      by = Math.max(legendH, Number(issue.bbox[1]) || 0);
      bw = Math.max(8,       Number(issue.bbox[2]) || 0);
      bh = Math.max(8,       Number(issue.bbox[3]) || 0);
      bw = Math.min(bw, width  - bx);
      bh = Math.min(bh, height - by);
      hasBbox = bw > 0 && bh > 0;
    }

    if (!hasBbox) {
      const derived = deriveViolationBbox(
        issue.ruleId, issue.message, width, height, pageNum, pageCount,
      );
      if (derived) {
        [bx, by, bw, bh] = derived;
        by = Math.max(legendH, by);
        bh = Math.min(bh, height - by);
        hasBbox = bw > 0 && bh > 0;
      }
    }

    if (hasBbox) {
      spatial.push({ issue, legIdx: i + 1, bx, by, bw, bh, area: bw * bh });
    } else {
      nonSpatial.push({ issue, legIdx: i + 1 });
    }
  });

  // Sort largest region first; suppress overlapping smaller boxes
  spatial.sort((a, b) => b.area - a.area);
  const selected: Candidate[] = [];
  for (const c of spatial) {
    if (selected.length >= MAX_BOXES_PER_PAGE) break;
    const blocked = selected.some(s => {
      const ix  = Math.max(c.bx, s.bx);
      const iy  = Math.max(c.by, s.by);
      const ix2 = Math.min(c.bx + c.bw, s.bx + s.bw);
      const iy2 = Math.min(c.by + c.bh, s.by + s.bh);
      if (ix2 <= ix || iy2 <= iy) return false;
      return (ix2 - ix) * (iy2 - iy) / Math.min(c.area, s.area) > 0.50;
    });
    if (!blocked) selected.push(c);
  }

  // Draw selected violation boxes + markers
  for (const { issue, legIdx, bx, by, bw, bh } of selected) {
    const col = severityColor(issue.severity);

    page.drawRectangle({
      x: bx, y: by, width: bw, height: bh,
      color:         col,
      opacity:       0.03,   // 3% fill — barely-there tint
      borderColor:   col,
      borderWidth:   0.50,
      borderOpacity: 0.40,
    });

    let cx: number, cy: number;
    if (bh > bw * 2.0) {
      // Tall strip (gutter / margin band): marker at vertical center
      cy = by + bh / 2;
      cx = bx + MARKER_RADIUS + 1;
    } else {
      // Wide or square region: top-center
      cx = bx + bw / 2;
      cy = by + bh - MARKER_RADIUS - 1;
    }
    cx = Math.max(MARKER_RADIUS + 1, Math.min(cx, width  - MARKER_RADIUS - 1));
    cy = Math.max(legendH + MARKER_RADIUS + 1, Math.min(cy, height - MARKER_RADIUS - 1));
    drawNumberedCircle(page, cx, cy, col, String(legIdx), font);
  }

  // Non-spatial FAIL issues: small marker only, no box
  for (const { issue, legIdx } of nonSpatial) {
    const col = severityColor(issue.severity);
    const cx  = Math.min(nonSpatialX, width - MARKER_RADIUS - 2);
    const cy  = Math.max(legendH + MARKER_RADIUS + 4, nonSpatialY);
    drawNumberedCircle(page, cx, cy, col, String(legIdx), font);
    nonSpatialX += (MARKER_RADIUS * 2 + 4);
  }
}

// ── Main annotation driver ─────────────────────────────────────────────────────

async function annotateDoc(
  doc:       PDFDocument,
  allIssues: AnnotationIssue[],
): Promise<void> {
  const pages     = doc.getPages();
  const pageCount = pages.length;
  if (!pageCount) return;

  // Embed fonts once for the whole document
  const font     = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // ── PASS 1: Governing geometry on EVERY page ─────────────────────────────
  // Trim boundary and safe-area box rendered consistently across the full document.
  for (let i = 0; i < pages.length; i++) {
    drawGoverningGeometry(pages[i], i + 1, pageCount);
  }

  if (!allIssues.length) return;

  // ── PASS 2: Issue markers + legend on pages that have issues ─────────────

  // Aggregate: collapse repeated identical violations into one entry with page range
  const aggregated = aggregateIssues(allIssues);

  // Overall document status — drives the banner color
  const overallStatus = getDocumentStatus(aggregated);

  // Classify: document-level (header panel on page 1) vs per-page (markers + legend)
  const globalIssues: AnnotationIssue[] = [];
  const byPage = new Map<number, AnnotationIssue[]>();

  for (const issue of aggregated) {
    if (isDocumentLevelRule(issue.ruleId, issue.message)) {
      globalIssues.push(issue);
    } else {
      const list = byPage.get(issue.page) ?? [];
      list.push(issue);
      byPage.set(issue.page, list);
    }
  }
  for (const list of byPage.values()) {
    list.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  }

  // Status banner — compact colored strip at the very top of page 1
  if (pages.length > 0) {
    drawStatusBanner(pages[0], overallStatus, font, boldFont);
  }

  // Document-level issues → header panel on page 1 only, below the status banner
  if (globalIssues.length > 0 && pages.length > 0) {
    globalIssues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
    drawDocumentHeaderPanel(pages[0], globalIssues, font, boldFont, STATUS_BANNER_H + BANNER_GAP);
  }

  // Sort pages by worst severity first, annotate up to the total cap
  const sortedPageNums = [...byPage.keys()].sort((a, b) => {
    const aW = byPage.get(a)![0].severity;
    const bW = byPage.get(b)![0].severity;
    return severityRank(aW) - severityRank(bW);
  });

  let remaining = MAX_ANNOTATIONS_TOTAL;

  for (const pageNum of sortedPageNums) {
    if (remaining <= 0) break;

    const issues = (byPage.get(pageNum) ?? []).slice(0, Math.min(remaining, MAX_LEGEND_ITEMS));
    if (!issues.length) continue;

    const page = pages[pageNum - 1];
    if (!page) continue;

    // Legend panel drawn first — establishes the reserved height at page bottom
    const legendH = getLegendHeight(issues.length);
    drawLegendPanel(page, issues, pageNum, font, boldFont);

    // Violation regions + anchored markers
    drawIssueMarkersOnPage(page, issues, legendH, pageNum, pageCount, font);

    remaining -= issues.length;
  }
}

// ── Supabase helpers ───────────────────────────────────────────────────────────

async function resolveSourcePdfKey(downloadId: string): Promise<string | null> {
  const { data: row } = await supabase
    .from("print_ready_checks")
    .select("our_job_id")
    .eq("result_download_id", downloadId)
    .maybeSingle();

  const ourJobId = row?.our_job_id;
  if (typeof ourJobId === "string" && ourJobId.trim()) {
    return `uploads/${ourJobId.trim()}.pdf`;
  }

  const meta = await getStored(downloadId);
  if (meta?.sourcePdfKey) return meta.sourcePdfKey;
  if (!meta?.storedPath)  return null;
  return meta.storedPath;
}

// ── Public export ──────────────────────────────────────────────────────────────

/**
 * Annotates the checker PDF for a given downloadId and returns the signed download URL.
 * Idempotent — if already annotated and status is "ready", returns the existing URL.
 * Returns null if the download doesn't exist or isn't a checker report.
 */
export async function annotateCheckerPdf(
  downloadId: string,
): Promise<{ annotatedPdfDownloadUrl: string } | null> {
  try {
    const meta = await getStored(downloadId);
    if (!meta) return null;
    if (!meta.processingReport || meta.processingReport.outputType !== "checker") return null;

    // Return cached PDF only when version matches current engine version.
    // Version mismatch means logic has changed — re-annotate and overwrite.
    if (
      meta.annotatedPdfDownloadUrl &&
      meta.annotatedPdfStatus === "ready" &&
      meta.annotationVersion === ANNOTATION_VERSION
    ) {
      return { annotatedPdfDownloadUrl: meta.annotatedPdfDownloadUrl };
    }

    const sourceKey = await resolveSourcePdfKey(downloadId);
    if (!sourceKey) return null;

    await updateAnnotatedState(downloadId, { status: "processing" });

    const sourcePdf = await getFileByKey(sourceKey);
    const doc       = await PDFDocument.load(sourcePdf, { updateMetadata: false });
    const pageCount = doc.getPageCount();

    const pageIssues: PageIssue[] = Array.isArray(meta.processingReport.page_issues)
      ? meta.processingReport.page_issues
      : [];
    const enrichedIssues: EnrichedIssue[] = Array.isArray(meta.processingReport.issuesEnriched)
      ? meta.processingReport.issuesEnriched
      : [];

    const allIssues = normalizeIssues(pageIssues, enrichedIssues, pageCount);
    await annotateDoc(doc, allIssues);

    // useObjectStreams: false preserves cross-reference table format,
    // preventing glyph corruption in PDFs with custom font encoding maps.
    const annotatedBytes          = await doc.save({ useObjectStreams: false });
    const annotatedBuffer         = Buffer.from(annotatedBytes);
    const annotatedFilename       = "annotated-local.pdf";

    await uploadFile(downloadId, annotatedFilename, annotatedBuffer);
    const annotatedPdfDownloadUrl = await getSignedDownloadUrl(downloadId, annotatedFilename);

    await updateAnnotatedState(downloadId, { status: "ready", annotatedPdfDownloadUrl });
    await updateMeta(downloadId, { annotationVersion: ANNOTATION_VERSION });

    return { annotatedPdfDownloadUrl };
  } catch (err) {
    console.error("[annotatePdf] annotateCheckerPdf failed:", err);
    return null;
  }
}
