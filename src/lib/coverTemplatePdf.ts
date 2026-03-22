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
  const page = doc.addPage([w, h]);

  const gray = rgb(0.5, 0.5, 0.5);
  const leafGreen = rgb(0.176, 0.416, 0.176); // #2D6A2D
  const safeZoneInset = 0.25 * PT_PER_INCH; // 0.25" safe zone inset from trim lines
  const thin = 0.5;
  const labelSize = 7;

  // Trim and spine x positions (left to right)
  const xBackTrimLeft = bleedPt;
  const xSpineLeft = bleedPt + trimW;
  const xSpineRight = bleedPt + trimW + spinePt;
  const xFrontTrimRight = bleedPt + trimW + spinePt + trimW;

  // Vertical trim
  const yBottomTrim = bleedPt;
  const yTopTrim = bleedPt + trimH;

  // 1. Bleed zone: light red border/fill (opacity 0.08)
  const bleedFill = rgb(1, 0.92, 0.92);
  page.drawRectangle({
    x: 0,
    y: 0,
    width: w,
    height: h,
    color: bleedFill,
    opacity: 0.08,
  });

  // 2. Back panel: light blue fill (opacity 0.08)
  const backBlue = rgb(0.9, 0.94, 1);
  page.drawRectangle({
    x: xBackTrimLeft,
    y: 0,
    width: trimW,
    height: h,
    color: backBlue,
    opacity: 0.08,
  });

  // 3. Spine panel: light yellow fill (opacity 0.15)
  const spineYellow = rgb(1, 1, 0.9);
  page.drawRectangle({
    x: xSpineLeft,
    y: 0,
    width: spinePt,
    height: h,
    color: spineYellow,
    opacity: 0.15,
  });

  // 4. Front panel: light green fill (opacity 0.08)
  const frontGreen = rgb(0.92, 1, 0.94);
  page.drawRectangle({
    x: xSpineRight,
    y: 0,
    width: trimW,
    height: h,
    color: frontGreen,
    opacity: 0.08,
  });

  // 5. All trim lines: solid gray; spine barriers: leaf green
  const drawVLine = (x: number, color = gray, thickness = thin) => {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: h },
      color,
      thickness,
    });
  };
  drawVLine(xBackTrimLeft);
  drawVLine(xSpineLeft, leafGreen, 1.0);   // spine barrier — leaf green
  drawVLine(xSpineRight, leafGreen, 1.0);  // spine barrier — leaf green
  drawVLine(xFrontTrimRight);

  page.drawLine({
    start: { x: 0, y: yBottomTrim },
    end: { x: w, y: yBottomTrim },
    color: gray,
    thickness: thin,
  });
  page.drawLine({
    start: { x: 0, y: yTopTrim },
    end: { x: w, y: yTopTrim },
    color: gray,
    thickness: thin,
  });

  // 5b. Safe zone rectangles — back and front panels, inset 0.25" from trim lines
  page.drawRectangle({
    x: xBackTrimLeft + safeZoneInset,
    y: yBottomTrim + safeZoneInset,
    width: trimW - safeZoneInset * 2,
    height: trimH - safeZoneInset * 2,
    borderColor: leafGreen,
    borderWidth: 1.5,
    opacity: 0,
  });

  page.drawRectangle({
    x: xSpineRight + safeZoneInset,
    y: yBottomTrim + safeZoneInset,
    width: trimW - safeZoneInset * 2,
    height: trimH - safeZoneInset * 2,
    borderColor: leafGreen,
    borderWidth: 1.5,
    opacity: 0,
  });

  // 5c. SAFE ZONE labels — centered inside each panel's safe zone box
  const szLabel = "SAFE ZONE";
  const szSize = 9;
  const szW = font.widthOfTextAtSize(szLabel, szSize);

  // Back panel — centered
  const backSafeX = xBackTrimLeft + safeZoneInset;
  const backSafeY = yBottomTrim + safeZoneInset;
  const backSafeW = trimW - safeZoneInset * 2;
  const backSafeH = trimH - safeZoneInset * 2;
  page.drawText(szLabel, {
    x: backSafeX + (backSafeW - szW) / 2,
    y: backSafeY + backSafeH / 2 - szSize / 2,
    size: szSize,
    font,
    color: leafGreen,
    opacity: 0.6,
  });

  // Front panel — centered
  const frontSafeX = xSpineRight + safeZoneInset;
  const frontSafeY = yBottomTrim + safeZoneInset;
  const frontSafeW = trimW - safeZoneInset * 2;
  const frontSafeH = trimH - safeZoneInset * 2;
  page.drawText(szLabel, {
    x: frontSafeX + (frontSafeW - szW) / 2,
    y: frontSafeY + frontSafeH / 2 - szSize / 2,
    size: szSize,
    font,
    color: leafGreen,
    opacity: 0.6,
  });

  // 6. Labels: Back, SPINE (centered, clear), Front
  const labelY = 6;
  const center = (x1: number, x2: number) => (x1 + x2) / 2;
  const drawLabel = (text: string, xCenter: number, size = labelSize) => {
    const tw = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: xCenter - tw / 2,
      y: labelY,
      size,
      font,
      color: gray,
    });
  };
  drawLabel("Back", center(xBackTrimLeft, xSpineLeft));
  drawLabel("SPINE", center(xSpineLeft, xSpineRight), 8);
  drawLabel("Front", center(xSpineRight, xFrontTrimRight));

  // 7. Barcode area — lower-left of back cover (KDP spec)
  const barcodeW = 2 * PT_PER_INCH;       // 2" wide — KDP minimum
  const barcodeH = 1.2 * PT_PER_INCH;     // 1.2" tall — KDP minimum
  const barcodeMargin = 0.25 * PT_PER_INCH; // 0.25" from trim edges
  const barcodeX = xBackTrimLeft + barcodeMargin; // lower-LEFT of back cover
  const barcodeY = yBottomTrim + barcodeMargin;

  // Light background fill
  page.drawRectangle({
    x: barcodeX,
    y: barcodeY,
    width: barcodeW,
    height: barcodeH,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: gray,
    borderWidth: 0.75,
  });

  // Label line 1
  const bl1 = "BARCODE AREA";
  const bl1Size = 7;
  const bl1W = font.widthOfTextAtSize(bl1, bl1Size);
  page.drawText(bl1, {
    x: barcodeX + (barcodeW - bl1W) / 2,
    y: barcodeY + barcodeH / 2 + 4,
    size: bl1Size,
    font,
    color: gray,
  });

  // Label line 2
  const bl2 = "Reserved for Amazon KDP barcode";
  const bl2Size = 5.5;
  const bl2W = font.widthOfTextAtSize(bl2, bl2Size);
  page.drawText(bl2, {
    x: barcodeX + (barcodeW - bl2W) / 2,
    y: barcodeY + barcodeH / 2 - 5,
    size: bl2Size,
    font,
    color: gray,
  });

  // Warning line 3
  const bl3 = "Do not place text or images here";
  const bl3Size = 5;
  const bl3W = font.widthOfTextAtSize(bl3, bl3Size);
  page.drawText(bl3, {
    x: barcodeX + (barcodeW - bl3W) / 2,
    y: barcodeY + barcodeH / 2 - 14,
    size: bl3Size,
    font,
    color: gray,
  });

  // 8. Spine variance warning — centered vertically on spine panel
  const spineWarning1 = 'ALLOW 0.0625"';
  const spineWarning2 = "VARIANCE";
  const sw1Size = 5.5;
  const sw2Size = 5.5;
  const spineCenterX = (xSpineLeft + xSpineRight) / 2;
  const spineWarningY = (yBottomTrim + yTopTrim) / 2 + 10;

  const sw1W = font.widthOfTextAtSize(spineWarning1, sw1Size);
  const sw2W = font.widthOfTextAtSize(spineWarning2, sw2Size);

  page.drawText(spineWarning1, {
    x: spineCenterX - sw1W / 2,
    y: spineWarningY,
    size: sw1Size,
    font,
    color: gray,
    opacity: 0.6,
  });
  page.drawText(spineWarning2, {
    x: spineCenterX - sw2W / 2,
    y: spineWarningY - 8,
    size: sw2Size,
    font,
    color: gray,
    opacity: 0.6,
  });

  return doc.save();
}
