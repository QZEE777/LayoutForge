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
const LEGEND_PADDING      = 7;  // pt top/bottom padding inside legend panel
const LEGEND_HEADER_H     = 14; // pt for "PAGE N — ISSUE LEGEND" header row
const LEGEND_ROW_H        = 18; // pt per issue row
const LEGEND_OVERFLOW_H   = 12; // pt for "+ N more" overflow note

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
 * Draws thin guide lines on an annotated page:
 *   - Trim boundary: dashed gray border 1pt inside page edge
 *   - KDP safe text area: dashed blue-gray rectangle using KDP margin requirements
 *
 * These guides are thin, low-opacity, and non-intrusive.
 */
function drawGoverningGeometry(
  page: PDFPage,
  pageNumber: number,
  pageCount: number,
  font: PDFFont,
): void {
  const { width, height } = page.getSize();
  const gutter       = getGutterPt(pageCount);
  const isRightPage  = pageNumber % 2 === 1; // odd = right page, gutter on left

  const marginLeft  = isRightPage ? gutter         : OUTER_MARGIN_PT;
  const marginRight = isRightPage ? OUTER_MARGIN_PT : gutter;

  // ── Trim boundary: thin dashed line 1pt inside page edge
  page.drawRectangle({
    x: 1, y: 1,
    width:  width  - 2,
    height: height - 2,
    borderColor:      COLOR.trim,
    borderWidth:      0.3,
    borderOpacity:    0.40,
    borderDashArray:  [4, 4],
    borderDashPhase:  0,
  });

  // ── Safe text area: KDP required margin rectangle
  const safeX = marginLeft;
  const safeY = TOP_BOTTOM_MARGIN_PT;
  const safeW = width  - marginLeft - marginRight;
  const safeH = height - TOP_BOTTOM_MARGIN_PT * 2;

  page.drawRectangle({
    x: safeX, y: safeY,
    width:  safeW,
    height: safeH,
    borderColor:      COLOR.safe,
    borderWidth:      0.4,
    borderOpacity:    0.32,
    borderDashArray:  [6, 3],
    borderDashPhase:  0,
  });

  // ── Tiny "SAFE" label — placed just outside safe area, top outer corner
  const labelText = "SAFE AREA";
  const labelSize = 4.5;
  const labelW    = font.widthOfTextAtSize(labelText, labelSize);
  const labelX    = isRightPage
    ? Math.min(safeX + safeW + 2, width - labelW - 1)
    : 1;
  const labelY    = safeY + safeH - 6;

  page.drawText(labelText, {
    x:       Math.max(1, labelX),
    y:       Math.max(safeY + 2, labelY),
    size:    labelSize,
    font,
    color:   COLOR.safe,
    opacity: 0.30,
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

// ── Issue markers on page ──────────────────────────────────────────────────────

/**
 * Draws numbered markers for each issue on the page.
 *
 * Issues WITH bbox:
 *   - Thin dashed rectangle outline at the bbox location
 *   - Small filled numbered circle at the top-left corner of the bbox
 *
 * Issues WITHOUT bbox (page-level):
 *   - Stacked numbered circles in the outer margin at page top
 */
function drawIssueMarkersOnPage(
  page:      PDFPage,
  issues:    AnnotationIssue[],
  legendH:   number,
  pageNum:   number,
  font:      PDFFont,
): void {
  const { width, height } = page.getSize();
  const shown = issues.slice(0, MAX_LEGEND_ITEMS);

  // Track outer-margin stack position for no-bbox markers
  let marginStackY = height - TOP_BOTTOM_MARGIN_PT - MARKER_RADIUS - 2;

  shown.forEach((issue, i) => {
    const col     = severityColor(issue.severity);
    const numStr  = String(i + 1);
    const numW    = font.widthOfTextAtSize(numStr, 6);

    if (issue.bbox) {
      const [xRaw, yRaw, wRaw, hRaw] = issue.bbox;
      const bx = Math.max(0,        Number(xRaw) || 0);
      const by = Math.max(legendH,  Number(yRaw) || 0);  // clamp above legend
      const bw = Math.max(8,        Number(wRaw) || 0);
      const bh = Math.max(8,        Number(hRaw) || 0);

      const clampedW = Math.min(bw, width  - bx);
      const clampedH = Math.min(bh, height - by);

      if (clampedW > 0 && clampedH > 0) {
        // Thin dashed outline at issue location
        page.drawRectangle({
          x: bx, y: by,
          width:  clampedW,
          height: clampedH,
          borderColor:     col,
          borderWidth:     0.5,
          borderOpacity:   0.60,
          borderDashArray: [3, 2],
          borderDashPhase: 0,
        });

        // Numbered marker at top-left corner of bbox
        const cx = Math.min(bx + MARKER_RADIUS + 0.5, width  - MARKER_RADIUS);
        const cy = Math.min(by + clampedH - MARKER_RADIUS - 0.5, height - MARKER_RADIUS);

        page.drawEllipse({
          x: cx, y: cy,
          xScale: MARKER_RADIUS,
          yScale: MARKER_RADIUS,
          color:   col,
          opacity: 0.90,
        });

        page.drawText(numStr, {
          x:       cx - numW / 2,
          y:       cy - 2.5,
          size:    6,
          font,
          color:   COLOR.markerText,
          opacity: 1,
        });
      }
    } else {
      // No bbox: stack marker in outer left margin area
      const cx = MARKER_RADIUS + 1;
      const cy = Math.max(legendH + MARKER_RADIUS + 4, marginStackY);

      page.drawEllipse({
        x: cx, y: cy,
        xScale: MARKER_RADIUS,
        yScale: MARKER_RADIUS,
        color:   col,
        opacity: 0.90,
      });

      page.drawText(numStr, {
        x:       cx - numW / 2,
        y:       cy - 2.5,
        size:    6,
        font,
        color:   COLOR.markerText,
        opacity: 1,
      });

      marginStackY -= (MARKER_RADIUS * 2 + 4);
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
  if (!pageCount || !allIssues.length) return;

  // Embed fonts once for the whole document
  const font     = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // De-duplicate: keep highest severity per (page, ruleId) signature
  const deduped = new Map<string, AnnotationIssue>();
  for (const issue of allIssues) {
    const sig      = `${issue.page}::${issue.ruleId}`;
    const existing = deduped.get(sig);
    if (!existing || severityRank(issue.severity) < severityRank(existing.severity)) {
      deduped.set(sig, issue);
    }
  }

  // Group by page, sort by severity (worst first)
  const byPage = new Map<number, AnnotationIssue[]>();
  for (const issue of deduped.values()) {
    const list = byPage.get(issue.page) ?? [];
    list.push(issue);
    byPage.set(issue.page, list);
  }
  for (const list of byPage.values()) {
    list.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  }

  // Sort pages by worst severity first, then annotate up to the total cap
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

    // 1. Governing geometry guides
    drawGoverningGeometry(page, pageNum, pageCount, font);

    // 2. Legend panel (must come before markers so we know the reserved height)
    const legendH = getLegendHeight(issues.length);
    drawLegendPanel(page, issues, pageNum, font, boldFont);

    // 3. Issue markers + bbox outlines
    drawIssueMarkersOnPage(page, issues, legendH, pageNum, font);

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

    const annotatedBytes          = await doc.save();
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
