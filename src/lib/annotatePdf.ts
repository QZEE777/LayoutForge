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
import { getStored, updateAnnotatedState } from "@/lib/storage";
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
};

// ── Constants ──────────────────────────────────────────────────────────────────

const PT = 72; // points per inch

// KDP margin requirements
const OUTER_MARGIN_PT      = 0.25 * PT; // 18pt  — KDP min outer margin
const TOP_BOTTOM_MARGIN_PT = 0.50 * PT; // 36pt  — KDP min top/bottom margin

// Annotation caps
const MAX_ANNOTATIONS_TOTAL = 30;
const MAX_LEGEND_ITEMS      = 4;   // max issues shown per page legend

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
  fail:    rgb(0.72, 0.12, 0.12), // muted red
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

  // ── Right-aligned column headers
  const colSevW   = boldFont.widthOfTextAtSize("SEVERITY", 5);
  page.drawText("SEVERITY", {
    x:       width - LEGEND_PADDING - colSevW,
    y:       headerY,
    size:    5,
    font:    boldFont,
    color:   COLOR.legendMuted,
    opacity: 0.60,
  });

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

    // Rule ID (bold) — line 1 left
    const ruleLabel = issue.ruleId.slice(0, 22);
    page.drawText(ruleLabel, {
      x:       textX,
      y:       line1Y,
      size:    6.0,
      font:    boldFont,
      color:   COLOR.legendText,
      opacity: 0.92,
    });

    // SEVERITY label — line 1 right
    const sevLabel = severityLabel(issue.severity);
    const sevW     = boldFont.widthOfTextAtSize(sevLabel, 5.5);
    page.drawText(sevLabel, {
      x:       width - LEGEND_PADDING - sevW,
      y:       line1Y,
      size:    5.5,
      font:    boldFont,
      color:   col,
      opacity: 0.90,
    });

    // Message or expected/observed — line 2
    const { expected, observed } = parseValues(issue.message);
    let line2Text: string;

    if (expected && observed) {
      line2Text = `Required: ${expected}  ·  Observed: ${observed}`;
    } else {
      const maxChars = Math.max(20, Math.floor((width - textX - 50) / 3.8));
      line2Text = issue.message.length > maxChars
        ? issue.message.slice(0, maxChars - 1) + "…"
        : issue.message;
    }

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
    page.drawText(`+ ${overflow} more issue${overflow > 1 ? "s" : ""} — see full report`, {
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

// ── Document-level header panel (page 1 only) ──────────────────────────────────

/**
 * Draws a compact header panel at the top of page 1 for document-level issues.
 * These do not correspond to any specific page location; they are shown here
 * once and never repeated on other pages.
 */
function drawDocumentHeaderPanel(
  page:     PDFPage,
  issues:   AnnotationIssue[],
  font:     PDFFont,
  boldFont: PDFFont,
): void {
  const { width, height } = page.getSize();
  const ph = DOC_HEADER_PADDING + DOC_HEADER_TITLE_H + issues.length * DOC_HEADER_ROW_H + DOC_HEADER_PADDING;
  const panelY = height - ph; // bottom y-coordinate of panel

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
  const titleY = height - DOC_HEADER_PADDING - DOC_HEADER_TITLE_H + 4;
  page.drawText("DOCUMENT-LEVEL CHECKS", {
    x: LEGEND_PADDING, y: titleY,
    size: 6.0, font: boldFont, color: COLOR.legendHeader, opacity: 0.90,
  });
  const sevHdrW = boldFont.widthOfTextAtSize("SEVERITY", 5);
  page.drawText("SEVERITY", {
    x: width - LEGEND_PADDING - sevHdrW, y: titleY,
    size: 5, font: boldFont, color: COLOR.legendMuted, opacity: 0.60,
  });

  // Issue rows
  issues.forEach((issue, i) => {
    const rowMidY = height - DOC_HEADER_PADDING - DOC_HEADER_TITLE_H - i * DOC_HEADER_ROW_H - DOC_HEADER_ROW_H / 2;
    const textY   = rowMidY - 2;
    const col     = severityColor(issue.severity);

    // Severity dot
    page.drawEllipse({
      x: LEGEND_PADDING + MARKER_RADIUS - 1, y: rowMidY,
      xScale: MARKER_RADIUS - 1.5, yScale: MARKER_RADIUS - 1.5,
      color: col, opacity: 0.85,
    });

    const textX      = LEGEND_PADDING + MARKER_RADIUS * 2 + 3;
    const ruleLabel  = issue.ruleId.slice(0, 22);
    const ruleLabelW = boldFont.widthOfTextAtSize(ruleLabel, 6.0);

    // Rule ID
    page.drawText(ruleLabel, {
      x: textX, y: textY,
      size: 6.0, font: boldFont, color: COLOR.legendText, opacity: 0.90,
    });

    // Message (truncated)
    const msgX     = textX + ruleLabelW + 6;
    const maxChars = Math.max(10, Math.floor((width - msgX - 65) / 3.8));
    const msg      = issue.message.length > maxChars
      ? issue.message.slice(0, maxChars - 1) + "…"
      : issue.message;
    page.drawText(msg, {
      x: msgX, y: textY,
      size: 5.5, font, color: COLOR.legendMuted, opacity: 0.85,
    });

    // Severity label right-aligned
    const sevLabel = severityLabel(issue.severity);
    const sevW     = boldFont.widthOfTextAtSize(sevLabel, 5.5);
    page.drawText(sevLabel, {
      x: width - LEGEND_PADDING - sevW, y: textY,
      size: 5.5, font: boldFont, color: col, opacity: 0.90,
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
 * Draws violation regions and anchored numbered markers for each issue.
 *
 * Issues WITH bbox (scanner-provided coordinates):
 *   - Semi-transparent filled rectangle over the violation zone
 *   - Solid 0.75pt border (no dash — visually distinct from geometry guides)
 *   - Numbered marker anchored at the top-left corner of the violation bbox
 *
 * Issues WITHOUT bbox, spatial rule (derived from KDP geometry):
 *   - Same filled+bordered region derived from margin/gutter coordinates
 *   - Numbered marker anchored at top-left of derived region
 *
 * Issues WITHOUT bbox, non-spatial (font embedding, colour mode, etc.):
 *   - Numbered marker placed at top of safe area — no floating in gutter
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

  // For non-spatial page-level issues, stack markers just inside the safe area top
  const gutter      = getGutterPt(pageCount);
  const isRight     = pageNum % 2 === 1;
  const safeLeft    = isRight ? gutter         : OUTER_MARGIN_PT;
  let   nonSpatialX = safeLeft + MARKER_RADIUS + 2;
  let   nonSpatialY = height - TOP_BOTTOM_MARGIN_PT - MARKER_RADIUS - 2;

  shown.forEach((issue, i) => {
    const col    = severityColor(issue.severity);
    const numStr = String(i + 1);

    // Resolve violation bbox — scanner data first, then derivation
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
      // ── Violation zone: minimal fill + restrained border
      page.drawRectangle({
        x: bx, y: by,
        width:  bw,
        height: bh,
        color:         col,
        opacity:       0.04,   // 4% fill — indicates zone without obscuring content
        borderColor:   col,
        borderWidth:   0.50,
        borderOpacity: 0.70,
        // Solid border — distinct from dashed geometry guides
      });

      // ── Marker: center-edge placement, index-spread to avoid clustering
      let cx: number, cy: number;
      if (bh > bw * 2.0) {
        // Tall strip (margin band, gutter): center of vertical edge, alternate sides
        cy = by + bh / 2;
        cx = i % 2 === 0 ? bx + MARKER_RADIUS + 1 : bx + bw - MARKER_RADIUS - 1;
      } else {
        // Wide or square region: top-center, horizontally spread by index
        const spread = (i - (shown.length - 1) / 2) * (MARKER_RADIUS * 2 + 4);
        cx = bx + bw / 2 + spread;
        cy = by + bh - MARKER_RADIUS - 1;
      }
      cx = Math.max(MARKER_RADIUS + 1, Math.min(cx, width  - MARKER_RADIUS - 1));
      cy = Math.max(legendH + MARKER_RADIUS + 1, Math.min(cy, height - MARKER_RADIUS - 1));
      drawNumberedCircle(page, cx, cy, col, numStr, font);
    } else {
      // ── Non-spatial page-level issue: marker at top of safe area (not floating)
      const cx = Math.min(nonSpatialX, width - MARKER_RADIUS - 2);
      const cy = Math.max(legendH + MARKER_RADIUS + 4, nonSpatialY);
      drawNumberedCircle(page, cx, cy, col, numStr, font);
      nonSpatialX += (MARKER_RADIUS * 2 + 4);
    }
  });
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

  // De-duplicate: keep highest severity per (page, ruleId) signature
  const deduped = new Map<string, AnnotationIssue>();
  for (const issue of allIssues) {
    const sig      = `${issue.page}::${issue.ruleId}`;
    const existing = deduped.get(sig);
    if (!existing || severityRank(issue.severity) < severityRank(existing.severity)) {
      deduped.set(sig, issue);
    }
  }

  // Classify: document-level (header panel on page 1) vs per-page (markers + legend)
  const globalIssues: AnnotationIssue[] = [];
  const byPage = new Map<number, AnnotationIssue[]>();

  for (const issue of deduped.values()) {
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

  // Document-level issues → header panel on page 1 only
  if (globalIssues.length > 0 && pages.length > 0) {
    globalIssues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
    drawDocumentHeaderPanel(pages[0], globalIssues, font, boldFont);
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

    // Already annotated — return existing URL
    if (meta.annotatedPdfDownloadUrl && meta.annotatedPdfStatus === "ready") {
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

    return { annotatedPdfDownloadUrl };
  } catch (err) {
    console.error("[annotatePdf] annotateCheckerPdf failed:", err);
    return null;
  }
}
