/**
 * Client-side KDP interior margin template PDF.
 * One page at trim size with margin guides, dimension annotations, and settings summary.
 * Visual style matches coverTemplatePdf.ts.
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

export async function createInteriorTemplatePdf(input: InteriorTemplateInput): Promise<Uint8Array> {
  const trim = getTrimSize(input.trimSizeId);
  if (!trim) throw new Error(`Unknown trim size: ${input.trimSizeId}`);

  const gutterInches = getGutterMargin(input.pageCount);
  const bleed = input.withBleed ? KDP_BLEED_INCHES : 0;

  const pageWidthInches  = trim.widthInches  + 2 * bleed;
  const pageHeightInches = trim.heightInches + 2 * bleed;
  const w = pageWidthInches  * PT_PER_INCH;
  const h = pageHeightInches * PT_PER_INCH;

  const gutterPt  = gutterInches            * PT_PER_INCH;
  const outsidePt = OUTSIDE_MARGIN_INCHES   * PT_PER_INCH;
  const bleedPt   = bleed                   * PT_PER_INCH;

  const doc      = await PDFDocument.create();
  const font     = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page     = doc.addPage([w, h]);

  const white     = rgb(1, 1, 1);
  const gray      = rgb(0.5, 0.5, 0.5);
  const darkGray  = rgb(0.3, 0.3, 0.3);
  const leafGreen = rgb(0.176, 0.416, 0.176);
  const orange    = rgb(0.85, 0.35, 0.05);
  const bleedFill = rgb(1, 0.92, 0.92);
  const thin      = 0.5;

  // ─────────────────────────────────────────────
  // 1. Background
  // ─────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: white });

  // ─────────────────────────────────────────────
  // 2. Bleed zone (if enabled)
  // ─────────────────────────────────────────────
  if (input.withBleed && bleed > 0) {
    page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: bleedFill, opacity: 0.25 });
    const trimLeft = bleedPt;
    const trimBottom = bleedPt;
    const trimW = w - bleedPt * 2;
    const trimH = h - bleedPt * 2;
    page.drawRectangle({ x: trimLeft, y: trimBottom, width: trimW, height: trimH, color: white });
    page.drawRectangle({ x: trimLeft, y: trimBottom, width: trimW, height: trimH, borderColor: gray, borderWidth: thin });

    // BLEED / TRIM label
    const trimLabel = "BLEED ZONE (0.125\")";
    const trimLabelSize = 5.5;
    const trimLabelW = font.widthOfTextAtSize(trimLabel, trimLabelSize);
    page.drawText(trimLabel, {
      x: trimLeft + (trimW - trimLabelW) / 2,
      y: trimBottom - 10,
      size: trimLabelSize, font, color: rgb(0.7, 0.2, 0.2), opacity: 0.7,
    });

    // TRIM LINE label on right
    const tlLabel = "← TRIM LINE";
    page.drawText(tlLabel, {
      x: trimLeft + trimW + 2,
      y: trimBottom + trimH / 2,
      size: 5.5, font, color: gray, opacity: 0.6,
    });
  }

  // ─────────────────────────────────────────────
  // 3. Safe zone (content area)
  // ─────────────────────────────────────────────
  const safeLeft   = gutterPt + bleedPt;
  const safeRight  = w - outsidePt - bleedPt;
  const safeBottom = outsidePt + bleedPt;
  const safeTop    = h - outsidePt - bleedPt;
  const safeWidth  = safeRight - safeLeft;
  const safeHeight = safeTop - safeBottom;

  // Light green fill
  page.drawRectangle({
    x: safeLeft, y: safeBottom, width: safeWidth, height: safeHeight,
    color: leafGreen, opacity: 0.08,
    borderColor: leafGreen, borderWidth: 1.5,
  });

  // ─────────────────────────────────────────────
  // 4. Margin zones — light fills to show exclusion areas
  // ─────────────────────────────────────────────
  const marginColor = rgb(1, 0.96, 0.80);
  const marginOpacity = 0.30;

  // Gutter (left margin)
  page.drawRectangle({ x: bleedPt, y: bleedPt, width: gutterPt, height: h - bleedPt * 2, color: marginColor, opacity: marginOpacity });
  // Top margin
  page.drawRectangle({ x: bleedPt, y: h - outsidePt - bleedPt, width: w - bleedPt * 2, height: outsidePt, color: marginColor, opacity: marginOpacity });
  // Bottom margin
  page.drawRectangle({ x: bleedPt, y: bleedPt, width: w - bleedPt * 2, height: outsidePt, color: marginColor, opacity: marginOpacity });
  // Right (outside) margin
  page.drawRectangle({ x: safeRight, y: bleedPt, width: outsidePt, height: h - bleedPt * 2, color: marginColor, opacity: marginOpacity });

  // ─────────────────────────────────────────────
  // 5. Gutter dashed guide line
  // ─────────────────────────────────────────────
  page.drawLine({
    start: { x: safeLeft, y: safeBottom },
    end:   { x: safeLeft, y: safeTop },
    color: orange, thickness: 0.75, dashArray: [5, 4],
  });

  // ─────────────────────────────────────────────
  // 6. Margin labels
  // ─────────────────────────────────────────────
  const mLabelSize = 6;

  // Gutter label — centered vertically on left margin
  const gutterLabel = `GUTTER ${gutterInches}"`;
  const gutterLabelW = font.widthOfTextAtSize(gutterLabel, mLabelSize);
  const gutterMidX = bleedPt + gutterPt / 2;
  page.drawText(gutterLabel, {
    x: gutterMidX - gutterLabelW / 2,
    y: h / 2 - mLabelSize / 2,
    size: mLabelSize, font: fontBold, color: orange, opacity: 0.7,
  });

  // Top margin label
  const topMidX = bleedPt + (w - bleedPt * 2) / 2;
  const topLabel = `TOP 0.25"`;
  const topLabelW = font.widthOfTextAtSize(topLabel, mLabelSize);
  page.drawText(topLabel, {
    x: topMidX - topLabelW / 2,
    y: h - outsidePt - bleedPt + outsidePt / 2 - mLabelSize / 2,
    size: mLabelSize, font, color: gray, opacity: 0.6,
  });

  // Bottom margin label
  const bottomLabel = `BOTTOM 0.25"`;
  const bottomLabelW = font.widthOfTextAtSize(bottomLabel, mLabelSize);
  page.drawText(bottomLabel, {
    x: topMidX - bottomLabelW / 2,
    y: bleedPt + outsidePt / 2 - mLabelSize / 2,
    size: mLabelSize, font, color: gray, opacity: 0.6,
  });

  // Outside (right) margin label
  const outsideLabel = `OUTSIDE 0.25"`;
  const outsideLabelW = font.widthOfTextAtSize(outsideLabel, mLabelSize);
  page.drawText(outsideLabel, {
    x: safeRight + (outsidePt - outsideLabelW) / 2,
    y: h / 2 - mLabelSize / 2,
    size: mLabelSize, font, color: gray, opacity: 0.55,
  });

  // ─────────────────────────────────────────────
  // 7. Dimension annotations — ruler brackets
  // ─────────────────────────────────────────────
  const dimSize = 6;
  const annotY  = bleedPt - (input.withBleed ? 22 : 14);

  const drawDimBracket = (label: string, x1: number, x2: number, y: number) => {
    const cx = (x1 + x2) / 2;
    const lw = font.widthOfTextAtSize(label, dimSize);
    page.drawLine({ start: { x: x1, y: y + 7 }, end: { x: x1, y: y - 2 }, color: gray, thickness: 0.5 });
    page.drawLine({ start: { x: x2, y: y + 7 }, end: { x: x2, y: y - 2 }, color: gray, thickness: 0.5 });
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color: gray, thickness: 0.5 });
    page.drawRectangle({ x: cx - lw / 2 - 2, y: y - 4, width: lw + 4, height: dimSize + 4, color: white, opacity: 1 });
    page.drawText(label, { x: cx - lw / 2, y: y - 1, size: dimSize, font, color: darkGray });
  };

  // Gutter bracket
  drawDimBracket(`${gutterInches}"`, bleedPt, safeLeft, annotY);
  // Text area width bracket
  drawDimBracket(`Text area: ${(trim.widthInches - gutterInches - OUTSIDE_MARGIN_INCHES).toFixed(3)}"`, safeLeft, safeRight, annotY);
  // Outside margin bracket
  drawDimBracket(`${OUTSIDE_MARGIN_INCHES}"`, safeRight, w - bleedPt, annotY);

  // Height annotation — right side
  const textAreaHeightIn = (trim.heightInches - OUTSIDE_MARGIN_INCHES * 2).toFixed(3);
  const hAnnotX = w - bleedPt + (input.withBleed ? 14 : 8);
  page.drawLine({ start: { x: hAnnotX, y: safeBottom }, end: { x: hAnnotX, y: safeTop }, color: gray, thickness: 0.5 });
  page.drawLine({ start: { x: hAnnotX - 4, y: safeBottom }, end: { x: hAnnotX + 4, y: safeBottom }, color: gray, thickness: 0.5 });
  page.drawLine({ start: { x: hAnnotX - 4, y: safeTop }, end: { x: hAnnotX + 4, y: safeTop }, color: gray, thickness: 0.5 });
  const hLabel = `${textAreaHeightIn}"`;
  page.drawText(hLabel, {
    x: hAnnotX + 5,
    y: (safeBottom + safeTop) / 2 - dimSize / 2,
    size: dimSize, font, color: darkGray,
  });

  // ─────────────────────────────────────────────
  // 8. Safe zone labels
  // ─────────────────────────────────────────────
  const szLabel = "SAFE ZONE";
  const szSize  = 9;
  const szW     = font.widthOfTextAtSize(szLabel, szSize);
  page.drawText(szLabel, {
    x: safeLeft + (safeWidth - szW) / 2,
    y: safeBottom + safeHeight / 2 + 4,
    size: szSize, font: fontBold, color: leafGreen, opacity: 0.55,
  });

  const hintText = "Keep all content inside this area";
  const hintSize = 6;
  const hintW    = font.widthOfTextAtSize(hintText, hintSize);
  page.drawText(hintText, {
    x: safeLeft + (safeWidth - hintW) / 2,
    y: safeBottom + safeHeight / 2 - 8,
    size: hintSize, font, color: leafGreen, opacity: 0.45,
  });

  const taLabel = `${(trim.widthInches - gutterInches - OUTSIDE_MARGIN_INCHES).toFixed(3)}" × ${textAreaHeightIn}"`;
  const taW = font.widthOfTextAtSize(taLabel, 6.5);
  page.drawText(taLabel, {
    x: safeLeft + (safeWidth - taW) / 2,
    y: safeBottom + safeHeight / 2 - 20,
    size: 6.5, font, color: leafGreen, opacity: 0.40,
  });

  // ─────────────────────────────────────────────
  // 9. Settings summary header
  // ─────────────────────────────────────────────
  const summaryStartY = safeTop + (input.withBleed ? 30 : 20);
  const summaryLines = [
    `KDP Interior Template — manu2print.com`,
    `Trim: ${trim.name}  |  Pages: ${input.pageCount}  |  Gutter: ${gutterInches}"  |  Outside: ${OUTSIDE_MARGIN_INCHES}"${input.withBleed ? "  |  Bleed: 0.125\"" : ""}`,
    `Text area: ${(trim.widthInches - gutterInches - OUTSIDE_MARGIN_INCHES).toFixed(3)}" × ${textAreaHeightIn}"`,
  ];
  summaryLines.forEach((line, i) => {
    const sz = i === 0 ? 7.5 : 6;
    const f  = i === 0 ? fontBold : font;
    const c  = i === 0 ? leafGreen : darkGray;
    page.drawText(line, { x: bleedPt + 2, y: summaryStartY - i * 10, size: sz, font: f, color: c });
  });

  // ─────────────────────────────────────────────
  // 10. Manny avatar + branding
  // ─────────────────────────────────────────────
  try {
    const mannyRes   = await fetch("/MANNY AVATAR.png");
    const mannyBytes = await mannyRes.arrayBuffer();
    const mannyImage = await doc.embedPng(new Uint8Array(mannyBytes));
    const mannySize  = 26;
    page.drawImage(mannyImage, {
      x: safeRight - mannySize - 4, y: safeBottom + 4,
      width: mannySize, height: mannySize, opacity: 0.55,
    });
  } catch { /* skip */ }

  const brandText = "manu2print.com";
  const brandSize = 6;
  const brandW    = font.widthOfTextAtSize(brandText, brandSize);
  page.drawText(brandText, {
    x: safeRight - brandW - 4, y: safeBottom + 34,
    size: brandSize, font: fontBold, color: leafGreen, opacity: 0.7,
  });

  // ─────────────────────────────────────────────
  // 11. Footer CTA
  // ─────────────────────────────────────────────
  const ctaText = "Check your interior PDF before KDP rejects it — manu2print.com/kdp-pdf-checker";
  const ctaSize = 5.5;
  const ctaW    = font.widthOfTextAtSize(ctaText, ctaSize);
  page.drawText(ctaText, {
    x: (w - ctaW) / 2, y: 4,
    size: ctaSize, font, color: gray, opacity: 0.5,
  });

  return doc.save();
}
