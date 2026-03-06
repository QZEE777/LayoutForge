/**
 * Client-side KDP interior margin template PDF.
 * One page at trim size with safe-zone rectangle (gutter + margins) for use as a Canva guide.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getTrimSize, getGutterMargin, KDP_BLEED_INCHES, type TrimSizeId } from "@/lib/kdpSpecs";

const PT_PER_INCH = 72;

/** Minimum outside margins (top, bottom, outside edge) in inches per KDP. */
const OUTSIDE_MARGIN_INCHES = 0.25;

export interface InteriorTemplateInput {
  trimSizeId: TrimSizeId;
  pageCount: number;
  /** Include bleed area (0.125" each side) and show trim line */
  withBleed?: boolean;
}

/**
 * Generate a single-page PDF template for KDP interior.
 * Page size = trim (or trim + bleed). Draws safe-zone rectangle: gutter (from page count) + 0.25" top/bottom/outside.
 * Use as a guide in Canva: keep content inside the safe zone.
 */
export async function createInteriorTemplatePdf(input: InteriorTemplateInput): Promise<Uint8Array> {
  const trim = getTrimSize(input.trimSizeId);
  if (!trim) throw new Error(`Unknown trim size: ${input.trimSizeId}`);

  const gutterInches = getGutterMargin(input.pageCount);
  const bleed = input.withBleed ? KDP_BLEED_INCHES : 0;

  const pageWidthInches = trim.widthInches + 2 * bleed;
  const pageHeightInches = trim.heightInches + 2 * bleed;
  const w = pageWidthInches * PT_PER_INCH;
  const h = pageHeightInches * PT_PER_INCH;

  const gutterPt = gutterInches * PT_PER_INCH;
  const outsidePt = OUTSIDE_MARGIN_INCHES * PT_PER_INCH;
  const bleedPt = bleed * PT_PER_INCH;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([w, h]);

  const gray = rgb(0.45, 0.45, 0.45);
  const safeZoneColor = rgb(0.2, 0.5, 0.3);
  const thin = 0.5;
  const labelSize = 8;

  // Safe zone (content area): gutter left, outside right, outside top/bottom
  // In PDF coords, origin is bottom-left. So: left = gutter, right = w - outside, bottom = outside, top = h - outside
  const safeLeft = gutterPt + bleedPt;
  const safeRight = w - outsidePt - bleedPt;
  const safeBottom = outsidePt + bleedPt;
  const safeTop = h - outsidePt - bleedPt;
  const safeWidth = safeRight - safeLeft;
  const safeHeight = safeTop - safeBottom;

  // Trim line (when bleed is on)
  if (input.withBleed && bleed > 0) {
    const trimLeft = bleedPt;
    const trimRight = w - bleedPt;
    const trimBottom = bleedPt;
    const trimTop = h - bleedPt;
    page.drawRectangle({
      x: trimLeft,
      y: trimBottom,
      width: trimRight - trimLeft,
      height: trimTop - trimBottom,
      borderColor: gray,
      borderWidth: thin,
    });
    page.drawText("Trim (cut line)", {
      x: trimLeft + 4,
      y: trimBottom - 14,
      size: 7,
      font,
      color: gray,
    });
  }

  // Safe zone rectangle (keep content inside)
  page.drawRectangle({
    x: safeLeft,
    y: safeBottom,
    width: safeWidth,
    height: safeHeight,
    borderColor: safeZoneColor,
    borderWidth: 1,
  });

  // Labels
  page.drawText("Safe zone — keep all content inside", {
    x: safeLeft + 4,
    y: safeTop - 14,
    size: labelSize,
    font,
    color: safeZoneColor,
  });
  page.drawText(`Gutter (inside): ${gutterInches}"`, {
    x: safeLeft + 4,
    y: safeBottom - 12,
    size: 7,
    font,
    color: gray,
  });
  page.drawText(`Trim: ${trim.name}  ·  Page count: ${input.pageCount}  ·  Margins: ${OUTSIDE_MARGIN_INCHES}"`, {
    x: safeLeft,
    y: safeBottom - 24,
    size: 6,
    font,
    color: gray,
  });

  return doc.save();
}
