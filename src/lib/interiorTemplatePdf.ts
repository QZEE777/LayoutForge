/**
 * Client-side KDP interior margin template PDF.
 * One page at trim size with safe-zone rectangle (gutter + margins) for use as a Canva guide.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
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

  const white = rgb(1, 1, 1);
  const gray = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.88, 0.88, 0.88);
  const bleedFill = rgb(1, 0.9, 0.92);
  const safeZoneBorder = rgb(0, 0.7, 0.3);
  const safeZoneFill = rgb(0, 0.7, 0.3);
  const gutterLineColor = rgb(0.2, 0.4, 0.8);
  const labelSize = 8;
  const thin = 0.5;

  // 1. Background: fill entire page white
  page.drawRectangle({
    x: 0,
    y: 0,
    width: w,
    height: h,
    color: white,
  });

  // 2. Bleed area (if withBleed): light red/pink filled rectangle showing 0.125" bleed zone on all sides
  if (input.withBleed && bleed > 0) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: w,
      height: h,
      color: bleedFill,
      opacity: 0.35,
    });
    // Trim boundary: solid gray rectangle (we'll draw trim rect on top of a white trim-sized rect so only bleed shows as pink)
    const trimLeft = bleedPt;
    const trimRight = w - bleedPt;
    const trimBottom = bleedPt;
    const trimTop = h - bleedPt;
    page.drawRectangle({
      x: trimLeft,
      y: trimBottom,
      width: trimRight - trimLeft,
      height: trimTop - trimBottom,
      color: white,
    });
    page.drawRectangle({
      x: trimLeft,
      y: trimBottom,
      width: trimRight - trimLeft,
      height: trimTop - trimBottom,
      borderColor: gray,
      borderWidth: thin,
    });
  }

  // Safe zone (content area): gutter left, outside right, outside top/bottom
  const safeLeft = gutterPt + bleedPt;
  const safeRight = w - outsidePt - bleedPt;
  const safeBottom = outsidePt + bleedPt;
  const safeTop = h - outsidePt - bleedPt;
  const safeWidth = safeRight - safeLeft;
  const safeHeight = safeTop - safeBottom;

  // 3. Safe zone: solid bright green filled rectangle (opacity ~0.15) + solid bright green border
  page.drawRectangle({
    x: safeLeft,
    y: safeBottom,
    width: safeWidth,
    height: safeHeight,
    color: safeZoneFill,
    opacity: 0.15,
    borderColor: safeZoneBorder,
    borderWidth: 1,
  });

  // 4. Gutter line: dashed vertical line in blue at gutter position from left edge
  page.drawLine({
    start: { x: safeLeft, y: safeBottom },
    end: { x: safeLeft, y: safeTop },
    color: gutterLineColor,
    thickness: 0.8,
    dashArray: [6, 4],
  });

  // 5. Labels
  page.drawText("Safe zone — keep all content inside", {
    x: safeLeft + 4,
    y: safeTop - 14,
    size: labelSize,
    font,
    color: safeZoneBorder,
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
  if (input.withBleed && bleed > 0) {
    page.drawText("Trim (cut line)", {
      x: bleedPt + 4,
      y: bleedPt - 14,
      size: 7,
      font,
      color: gray,
    });
  }

  // 6. Watermark: centered on page, "manu2print.com" large light gray, opacity 0.12, size 28pt, rotated 45°
  const watermarkText = "manu2print.com";
  const watermarkSize = 28;
  const tw = font.widthOfTextAtSize(watermarkText, watermarkSize);
  const cx = (w - tw) / 2;
  const cy = h / 2 - watermarkSize / 2;
  page.drawText(watermarkText, {
    x: cx,
    y: cy,
    size: watermarkSize,
    font,
    color: lightGray,
    opacity: 0.12,
    rotate: degrees(45),
  });

  // 7. Footer: "Generated by manu2print.com — KDP Interior Template" small gray at bottom
  const footerText = "Generated by manu2print.com — KDP Interior Template";
  const footerSize = 6;
  const footerW = font.widthOfTextAtSize(footerText, footerSize);
  page.drawText(footerText, {
    x: (w - footerW) / 2,
    y: 8,
    size: footerSize,
    font,
    color: gray,
  });

  return doc.save();
}
