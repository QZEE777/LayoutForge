/**
 * Client-side KDP interior margin template PDF.
 * One page at trim size with safe-zone rectangle (gutter + margins) for use as a Canva guide.
 * Visual style matches coverTemplatePdf.ts — leaf green safe zone, gray trim lines, manu2print branding.
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

  // Colors — matched to coverTemplatePdf.ts
  const white      = rgb(1, 1, 1);
  const gray       = rgb(0.5, 0.5, 0.5);
  const leafGreen  = rgb(0.176, 0.416, 0.176); // #2D6A2D
  const bleedFill  = rgb(1, 0.92, 0.92);        // light red bleed zone
  const thin = 0.5;
  const labelSize = 7;

  // 1. Background: white
  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: white });

  // 2. Bleed area (if withBleed): light red fill + white trim area on top
  if (input.withBleed && bleed > 0) {
    page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: bleedFill, opacity: 0.25 });
    const trimLeft   = bleedPt;
    const trimBottom = bleedPt;
    const trimW      = w - bleedPt * 2;
    const trimH      = h - bleedPt * 2;
    // White fill over trim area
    page.drawRectangle({ x: trimLeft, y: trimBottom, width: trimW, height: trimH, color: white });
    // Trim line in gray
    page.drawRectangle({ x: trimLeft, y: trimBottom, width: trimW, height: trimH, borderColor: gray, borderWidth: thin });
    // Trim line label
    const trimLabel = "TRIM LINE";
    const trimLabelSize = 6;
    const trimLabelW = font.widthOfTextAtSize(trimLabel, trimLabelSize);
    page.drawText(trimLabel, {
      x: trimLeft + (trimW - trimLabelW) / 2,
      y: trimBottom - 10,
      size: trimLabelSize,
      font,
      color: gray,
      opacity: 0.7,
    });
  }

  // Safe zone (content area)
  const safeLeft   = gutterPt + bleedPt;
  const safeRight  = w - outsidePt - bleedPt;
  const safeBottom = outsidePt + bleedPt;
  const safeTop    = h - outsidePt - bleedPt;
  const safeWidth  = safeRight - safeLeft;
  const safeHeight = safeTop - safeBottom;

  // 3. Margin area label (outside safe zone, between page edge and safe zone)
  const marginLabel = "MARGIN AREA";
  const marginLabelSize = 6;
  const marginLabelW = font.widthOfTextAtSize(marginLabel, marginLabelSize);
  // Left margin label (between left edge/bleed and gutter)
  const leftMarginMidX = bleedPt + gutterPt / 2;
  page.drawText(marginLabel, {
    x: leftMarginMidX - marginLabelW / 2,
    y: h / 2 - marginLabelSize / 2,
    size: marginLabelSize,
    font,
    color: gray,
    opacity: 0.5,
  });

  // 4. Safe zone: leaf green fill (opacity 0.10) + leaf green border
  page.drawRectangle({
    x: safeLeft,
    y: safeBottom,
    width: safeWidth,
    height: safeHeight,
    color: leafGreen,
    opacity: 0.10,
    borderColor: leafGreen,
    borderWidth: 1.5,
  });

  // 5. Gutter line: dashed gray vertical at gutter position
  page.drawLine({
    start: { x: safeLeft, y: safeBottom },
    end:   { x: safeLeft, y: safeTop },
    color: gray,
    thickness: 0.75,
    dashArray: [5, 4],
  });

  // 6. Labels inside safe zone
  // SAFE ZONE — centered
  const szLabel = "SAFE ZONE";
  const szSize  = 9;
  const szW     = font.widthOfTextAtSize(szLabel, szSize);
  page.drawText(szLabel, {
    x: safeLeft + (safeWidth - szW) / 2,
    y: safeBottom + safeHeight / 2 - szSize / 2,
    size: szSize,
    font,
    color: leafGreen,
    opacity: 0.6,
  });

  // "Keep all content inside this area" — centered below SAFE ZONE label
  const hintText = "Keep all content inside this area";
  const hintSize = 6;
  const hintW    = font.widthOfTextAtSize(hintText, hintSize);
  page.drawText(hintText, {
    x: safeLeft + (safeWidth - hintW) / 2,
    y: safeBottom + safeHeight / 2 - szSize / 2 - hintSize - 3,
    size: hintSize,
    font,
    color: leafGreen,
    opacity: 0.5,
  });

  // Gutter measurement label — bottom-left inside safe zone
  page.drawText(`Gutter (inside): ${gutterInches}"`, {
    x: safeLeft + 4,
    y: safeBottom + 4,
    size: labelSize,
    font,
    color: gray,
    opacity: 0.7,
  });

  // Spec line — bottom right inside safe zone
  const specText = `Trim: ${trim.name}  ·  Pages: ${input.pageCount}  ·  Outside margin: ${OUTSIDE_MARGIN_INCHES}"`;
  const specSize = 5.5;
  const specW    = font.widthOfTextAtSize(specText, specSize);
  page.drawText(specText, {
    x: safeLeft + (safeWidth - specW) / 2,
    y: safeBottom - 14,
    size: specSize,
    font,
    color: gray,
    opacity: 0.7,
  });

  // 7. Manny avatar — bottom-right corner of safe zone
  try {
    const mannyRes   = await fetch("/MANNY AVATAR.png");
    const mannyBytes = await mannyRes.arrayBuffer();
    const mannyImage = await doc.embedPng(new Uint8Array(mannyBytes));
    const mannySize  = 28; // pts
    page.drawImage(mannyImage, {
      x: safeRight - mannySize - 4,
      y: safeBottom + 4,
      width:  mannySize,
      height: mannySize,
      opacity: 0.55,
    });
  } catch {
    // Manny image not available — skip silently
  }

  // 8. manu2print.com brand — bottom-right of safe zone, above Manny
  const brandText = "manu2print.com";
  const brandSize = 6;
  const brandW    = font.widthOfTextAtSize(brandText, brandSize);
  page.drawText(brandText, {
    x: safeRight - brandW - 4,
    y: safeBottom + 36,
    size: brandSize,
    font,
    color: leafGreen,
    opacity: 0.7,
  });

  // 9. Lead gen CTA footer — centered at very bottom of page
  const ctaText = "Check your interior PDF before Amazon rejects it — manu2print.com/kdp-pdf-checker";
  const ctaSize = 5.5;
  const ctaW    = font.widthOfTextAtSize(ctaText, ctaSize);
  page.drawText(ctaText, {
    x: (w - ctaW) / 2,
    y: 4,
    size: ctaSize,
    font,
    color: gray,
    opacity: 0.5,
  });

  return doc.save();
}
