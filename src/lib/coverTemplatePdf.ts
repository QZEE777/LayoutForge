/**
 * Client-side KDP full-wrap cover template PDF.
 * One page at exact dimensions with trim and spine guide lines.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PT_PER_INCH = 72;

export interface CoverTemplateInput {
  /** Full-wrap width in inches */
  widthInches: number;
  /** Full-wrap height in inches */
  heightInches: number;
  /** Spine width in inches */
  spineWidthInches: number;
  /** Trim width in inches (one face) */
  trimWidthInches: number;
  /** Trim height in inches */
  trimHeightInches: number;
  /** Bleed in inches (default 0.125) */
  bleedInches?: number;
  /** Page count — for settings summary in PDF */
  pageCount?: number;
  /** Paper type label — for settings summary in PDF */
  paperTypeLabel?: string;
}

/**
 * Generate a single-page PDF template for the full-wrap cover.
 * Page size = widthInches × heightInches. Draws trim and spine lines, panel fills, safe zones, barcode area.
 */
export async function createCoverTemplatePdf(input: CoverTemplateInput): Promise<Uint8Array> {
  const bleed = input.bleedInches ?? 0.125;
  const w = input.widthInches * PT_PER_INCH;
  const h = input.heightInches * PT_PER_INCH;
  const bleedPt = bleed * PT_PER_INCH;
  const spinePt = input.spineWidthInches * PT_PER_INCH;
  const trimW = input.trimWidthInches * PT_PER_INCH;
  const trimH = input.trimHeightInches * PT_PER_INCH;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([w, h]);

  const gray = rgb(0.5, 0.5, 0.5);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const leafGreen = rgb(0.176, 0.416, 0.176); // #2D6A2D
  const orange = rgb(0.85, 0.35, 0.05);
  const safeZoneInset = 0.25 * PT_PER_INCH; // 0.25" safe zone from trim
  const thin = 0.5;

  // Trim and spine x positions (left to right)
  const xBackTrimLeft = bleedPt;
  const xSpineLeft = bleedPt + trimW;
  const xSpineRight = bleedPt + trimW + spinePt;
  const xFrontTrimRight = bleedPt + trimW + spinePt + trimW;

  // Vertical trim
  const yBottomTrim = bleedPt;
  const yTopTrim = bleedPt + trimH;

  // ─────────────────────────────────────────────
  // 1. Bleed zone background
  // ─────────────────────────────────────────────
  page.drawRectangle({
    x: 0, y: 0, width: w, height: h,
    color: rgb(1, 0.92, 0.92),
    opacity: 0.10,
  });

  // ─────────────────────────────────────────────
  // 2. Panel fills
  // ─────────────────────────────────────────────
  // Back panel — light blue
  page.drawRectangle({
    x: xBackTrimLeft, y: yBottomTrim,
    width: trimW, height: trimH,
    color: rgb(0.90, 0.94, 1),
    opacity: 0.20,
  });
  // Spine panel — light amber
  page.drawRectangle({
    x: xSpineLeft, y: 0,
    width: spinePt, height: h,
    color: rgb(1, 0.96, 0.80),
    opacity: 0.35,
  });
  // Front panel — light green
  page.drawRectangle({
    x: xSpineRight, y: yBottomTrim,
    width: trimW, height: trimH,
    color: rgb(0.92, 1, 0.93),
    opacity: 0.20,
  });

  // ─────────────────────────────────────────────
  // 3. Trim lines
  // ─────────────────────────────────────────────
  const drawVLine = (x: number, color = gray, thickness = thin) => {
    page.drawLine({ start: { x, y: 0 }, end: { x, y: h }, color, thickness });
  };
  drawVLine(xBackTrimLeft);
  drawVLine(xSpineLeft, leafGreen, 1.2);
  drawVLine(xSpineRight, leafGreen, 1.2);
  drawVLine(xFrontTrimRight);

  page.drawLine({ start: { x: 0, y: yBottomTrim }, end: { x: w, y: yBottomTrim }, color: gray, thickness: thin });
  page.drawLine({ start: { x: 0, y: yTopTrim },    end: { x: w, y: yTopTrim },    color: gray, thickness: thin });

  // ─────────────────────────────────────────────
  // 4. Safe zone rectangles
  // ─────────────────────────────────────────────
  // Back panel safe zone
  page.drawRectangle({
    x: xBackTrimLeft + safeZoneInset,
    y: yBottomTrim + safeZoneInset,
    width: trimW - safeZoneInset * 2,
    height: trimH - safeZoneInset * 2,
    borderColor: leafGreen,
    borderWidth: 1.0,
    opacity: 0,
  });
  // Front panel safe zone
  page.drawRectangle({
    x: xSpineRight + safeZoneInset,
    y: yBottomTrim + safeZoneInset,
    width: trimW - safeZoneInset * 2,
    height: trimH - safeZoneInset * 2,
    borderColor: leafGreen,
    borderWidth: 1.0,
    opacity: 0,
  });

  // ─────────────────────────────────────────────
  // 5. SAFE ZONE labels (centered, faint)
  // ─────────────────────────────────────────────
  const szLabel = "SAFE ZONE";
  const szSize = 8;
  const szW = font.widthOfTextAtSize(szLabel, szSize);

  const backCenterX = xBackTrimLeft + trimW / 2;
  const frontCenterX = xSpineRight + trimW / 2;
  const safeZoneLabelY = yBottomTrim + safeZoneInset + 6;

  page.drawText(szLabel, {
    x: backCenterX - szW / 2, y: safeZoneLabelY,
    size: szSize, font, color: leafGreen, opacity: 0.45,
  });
  page.drawText(szLabel, {
    x: frontCenterX - szW / 2, y: safeZoneLabelY,
    size: szSize, font, color: leafGreen, opacity: 0.45,
  });

  // ─────────────────────────────────────────────
  // 6. Spine text zone — only if spine >= 0.75"
  // ─────────────────────────────────────────────
  const spineTextMinInches = 0.75;
  const hasSpineText = input.spineWidthInches >= spineTextMinInches;

  if (hasSpineText) {
    // Spine text safe zone: inset 0.0625" from each spine barrier
    const spineTextInset = 0.0625 * PT_PER_INCH;
    const spineTextZoneH = trimH - safeZoneInset * 2;
    const spineTextZoneW = spinePt - spineTextInset * 2;
    const spineTextX = xSpineLeft + spineTextInset;
    const spineTextY = yBottomTrim + safeZoneInset;

    page.drawRectangle({
      x: spineTextX, y: spineTextY,
      width: spineTextZoneW, height: spineTextZoneH,
      borderColor: orange,
      borderWidth: 0.75,
      opacity: 0,
    });

    // Rotated "SPINE TEXT AREA" label — we fake rotation by placing it vertically centered
    const stLabel = "SPINE TEXT AREA";
    const stSize = Math.min(5.5, spinePt * 0.28);
    const stW = font.widthOfTextAtSize(stLabel, stSize);
    const spineCenter = (xSpineLeft + xSpineRight) / 2;
    const spineMidY = (yBottomTrim + yTopTrim) / 2;

    // Draw the label (pdf-lib doesn't support rotation natively — we write it horizontally, centered)
    page.drawText(stLabel, {
      x: spineCenter - stW / 2, y: spineMidY + 4,
      size: stSize, font, color: orange, opacity: 0.65,
    });

    // Spine variance warning below
    const varLabel = 'Allow ±0.0625" variance';
    const varSize = 5;
    const varW = font.widthOfTextAtSize(varLabel, varSize);
    page.drawText(varLabel, {
      x: spineCenter - varW / 2, y: spineMidY - 10,
      size: varSize, font, color: gray, opacity: 0.7,
    });
  } else {
    // Spine too narrow — warn clearly
    const noTextLabel = "SPINE TOO";
    const noTextLabel2 = "NARROW";
    const noTextLabel3 = "FOR TEXT";
    const ntSize = Math.min(6, spinePt * 0.28);
    const spineCenter = (xSpineLeft + xSpineRight) / 2;
    const spineMidY = (yBottomTrim + yTopTrim) / 2;

    [noTextLabel, noTextLabel2, noTextLabel3].forEach((line, i) => {
      const lw = font.widthOfTextAtSize(line, ntSize);
      page.drawText(line, {
        x: spineCenter - lw / 2, y: spineMidY + 8 - i * 10,
        size: ntSize, font: fontBold, color: rgb(0.7, 0.1, 0.1), opacity: 0.7,
      });
    });
  }

  // ─────────────────────────────────────────────
  // 7. Panel labels (Back / SPINE / Front)
  // ─────────────────────────────────────────────
  const labelY = yTopTrim + 8;
  const drawPanelLabel = (text: string, xCenter: number, size = 9) => {
    const tw = fontBold.widthOfTextAtSize(text, size);
    page.drawText(text, { x: xCenter - tw / 2, y: labelY, size, font: fontBold, color: darkGray });
  };
  drawPanelLabel("BACK COVER", (xBackTrimLeft + xSpineLeft) / 2);
  drawPanelLabel("SPINE",      (xSpineLeft + xSpineRight) / 2, 7);
  drawPanelLabel("FRONT COVER", (xSpineRight + xFrontTrimRight) / 2);

  // ─────────────────────────────────────────────
  // 8. Dimension annotations — ruler-style labels
  // ─────────────────────────────────────────────
  const dimY = yBottomTrim - 22; // below bottom trim line
  const dimSize = 6.5;

  // Helper: draw a bracketed dimension label
  const drawDimLabel = (label: string, x1: number, x2: number, y: number) => {
    const cx = (x1 + x2) / 2;
    const lw = font.widthOfTextAtSize(label, dimSize);
    // tick lines
    page.drawLine({ start: { x: x1, y: y + 8 }, end: { x: x1, y: y - 2 }, color: gray, thickness: 0.5 });
    page.drawLine({ start: { x: x2, y: y + 8 }, end: { x: x2, y: y - 2 }, color: gray, thickness: 0.5 });
    // horizontal rule
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, color: gray, thickness: 0.5 });
    // label
    page.drawRectangle({ x: cx - lw / 2 - 2, y: y - 4, width: lw + 4, height: dimSize + 4, color: rgb(1,1,1), opacity: 1 });
    page.drawText(label, { x: cx - lw / 2, y: y - 1, size: dimSize, font, color: darkGray });
  };

  // Back panel width
  drawDimLabel(`${input.trimWidthInches.toFixed(3)}"`, xBackTrimLeft, xSpineLeft, dimY);
  // Spine width
  drawDimLabel(`${input.spineWidthInches.toFixed(3)}"`, xSpineLeft, xSpineRight, dimY);
  // Front panel width
  drawDimLabel(`${input.trimWidthInches.toFixed(3)}"`, xSpineRight, xFrontTrimRight, dimY);

  // Total width label
  const totalLabel = `Total: ${input.widthInches.toFixed(3)}" × ${input.heightInches.toFixed(3)}"  (incl. 0.125" bleed)`;
  const totalLabelW = font.widthOfTextAtSize(totalLabel, 6);
  page.drawText(totalLabel, {
    x: w / 2 - totalLabelW / 2, y: dimY - 14,
    size: 6, font, color: gray,
  });

  // Height annotation — right side
  const heightLabel = `${input.trimHeightInches.toFixed(3)}"`;
  const hlW = font.widthOfTextAtSize(heightLabel, dimSize);
  page.drawLine({ start: { x: xFrontTrimRight + 12, y: yBottomTrim }, end: { x: xFrontTrimRight + 12, y: yTopTrim }, color: gray, thickness: 0.5 });
  page.drawLine({ start: { x: xFrontTrimRight + 8, y: yBottomTrim }, end: { x: xFrontTrimRight + 16, y: yBottomTrim }, color: gray, thickness: 0.5 });
  page.drawLine({ start: { x: xFrontTrimRight + 8, y: yTopTrim }, end: { x: xFrontTrimRight + 16, y: yTopTrim }, color: gray, thickness: 0.5 });
  page.drawText(heightLabel, {
    x: xFrontTrimRight + 18, y: (yBottomTrim + yTopTrim) / 2 - dimSize / 2,
    size: dimSize, font, color: darkGray,
  });

  // ─────────────────────────────────────────────
  // 9. Barcode area — lower-RIGHT of back cover (KDP spec: near spine, bottom)
  // ─────────────────────────────────────────────
  const barcodeW = 2 * PT_PER_INCH;
  const barcodeH = 1.2 * PT_PER_INCH;
  const barcodeMargin = 0.25 * PT_PER_INCH;
  // Lower-right of back panel = near spine barrier, at bottom
  const barcodeX = xSpineLeft - barcodeMargin - barcodeW;
  const barcodeY = yBottomTrim + barcodeMargin;

  page.drawRectangle({
    x: barcodeX, y: barcodeY, width: barcodeW, height: barcodeH,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: gray,
    borderWidth: 0.75,
  });

  const bl1 = "BARCODE AREA";
  const bl1Size = 7;
  page.drawText(bl1, {
    x: barcodeX + (barcodeW - font.widthOfTextAtSize(bl1, bl1Size)) / 2,
    y: barcodeY + barcodeH / 2 + 5,
    size: bl1Size, font: fontBold, color: gray,
  });
  const bl2 = "Reserved for Amazon KDP barcode";
  const bl2Size = 5.5;
  page.drawText(bl2, {
    x: barcodeX + (barcodeW - font.widthOfTextAtSize(bl2, bl2Size)) / 2,
    y: barcodeY + barcodeH / 2 - 4,
    size: bl2Size, font, color: gray,
  });
  const bl3 = "Do not place artwork or text here";
  const bl3Size = 5;
  page.drawText(bl3, {
    x: barcodeX + (barcodeW - font.widthOfTextAtSize(bl3, bl3Size)) / 2,
    y: barcodeY + barcodeH / 2 - 14,
    size: bl3Size, font, color: rgb(0.7, 0.1, 0.1),
  });

  // ─────────────────────────────────────────────
  // 10. Settings summary — top-left corner header
  // ─────────────────────────────────────────────
  const summaryLines = [
    `KDP Full-Wrap Cover Template — manu2print.com`,
    `Trim: ${input.trimWidthInches}" × ${input.trimHeightInches}"  |  Pages: ${input.pageCount ?? "—"}  |  Paper: ${input.paperTypeLabel ?? "—"}`,
    `Canvas: ${input.widthInches.toFixed(3)}" × ${input.heightInches.toFixed(3)}"  |  Spine: ${input.spineWidthInches.toFixed(3)}"  |  Bleed: 0.125" all sides  |  300 DPI`,
  ];
  const summaryStartY = yTopTrim + 32;
  summaryLines.forEach((line, i) => {
    const sz = i === 0 ? 7.5 : 6;
    const f = i === 0 ? fontBold : font;
    const c = i === 0 ? leafGreen : darkGray;
    page.drawText(line, {
      x: xBackTrimLeft + 2,
      y: summaryStartY - i * 10,
      size: sz, font: f, color: c,
    });
  });

  // ─────────────────────────────────────────────
  // 11. Manny avatar branding — bottom-right of front panel safe zone
  // ─────────────────────────────────────────────
  try {
    const mannyRes = await fetch("/MANNY AVATAR.png");
    const mannyBytes = await mannyRes.arrayBuffer();
    const mannyImage = await doc.embedPng(new Uint8Array(mannyBytes));
    const mannySize = 30;
    const mannyX = xFrontTrimRight - safeZoneInset - mannySize - 2;
    const mannyY = yBottomTrim + safeZoneInset + 2;
    page.drawImage(mannyImage, { x: mannyX, y: mannyY, width: mannySize, height: mannySize, opacity: 0.65 });
  } catch {
    // Manny image not available — skip silently
  }

  // manu2print.com brand line
  const brandText = "manu2print.com";
  const brandSize = 6.5;
  const brandW = font.widthOfTextAtSize(brandText, brandSize);
  page.drawText(brandText, {
    x: xFrontTrimRight - safeZoneInset - brandW,
    y: yBottomTrim + safeZoneInset + 36,
    size: brandSize, font: fontBold, color: leafGreen, opacity: 0.8,
  });

  // ─────────────────────────────────────────────
  // 12. Footer CTA
  // ─────────────────────────────────────────────
  const ctaText = "Check your interior PDF before KDP rejects it — manu2print.com/kdp-pdf-checker";
  const ctaSize = 5.5;
  const ctaW = font.widthOfTextAtSize(ctaText, ctaSize);
  page.drawText(ctaText, {
    x: (w - ctaW) / 2, y: 4,
    size: ctaSize, font, color: gray, opacity: 0.5,
  });

  return doc.save();
}
