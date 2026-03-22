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
 * Page size = widthInches × heightInches. Draws trim and spine lines, panel fills, watermark, footer.
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
  const lightGray = rgb(0.88, 0.88, 0.88);
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
    borderWidth: 0.75,
    opacity: 0,
  });

  page.drawRectangle({
    x: xSpineRight + safeZoneInset,
    y: yBottomTrim + safeZoneInset,
    width: trimW - safeZoneInset * 2,
    height: trimH - safeZoneInset * 2,
    borderColor: leafGreen,
    borderWidth: 0.75,
    opacity: 0,
  });

  // 5c. SAFE ZONE labels inside each panel
  const safeZoneLabel = "SAFE ZONE";
  const safeZoneLabelSize = 6;
  const safeZoneLabelW = font.widthOfTextAtSize(safeZoneLabel, safeZoneLabelSize);
  void safeZoneLabelW; // used for centering reference

  // Back panel — top-left
  page.drawText(safeZoneLabel, {
    x: xBackTrimLeft + safeZoneInset + 4,
    y: yTopTrim - safeZoneInset - safeZoneLabelSize - 2,
    size: safeZoneLabelSize,
    font,
    color: leafGreen,
    opacity: 0.7,
  });

  // Front panel — top-left
  page.drawText(safeZoneLabel, {
    x: xSpineRight + safeZoneInset + 4,
    y: yTopTrim - safeZoneInset - safeZoneLabelSize - 2,
    size: safeZoneLabelSize,
    font,
    color: leafGreen,
    opacity: 0.7,
  });

  // Back panel — bottom-left
  page.drawText(safeZoneLabel, {
    x: xBackTrimLeft + safeZoneInset + 4,
    y: yBottomTrim + safeZoneInset + 3,
    size: safeZoneLabelSize,
    font,
    color: leafGreen,
    opacity: 0.7,
  });

  // Front panel — bottom-left
  page.drawText(safeZoneLabel, {
    x: xSpineRight + safeZoneInset + 4,
    y: yBottomTrim + safeZoneInset + 3,
    size: safeZoneLabelSize,
    font,
    color: leafGreen,
    opacity: 0.7,
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

  // 7. Watermark: "manu2print.com" centered, light gray, opacity 0.12, size 24pt
  const watermarkText = "manu2print.com";
  const watermarkSize = 24;
  const ww = font.widthOfTextAtSize(watermarkText, watermarkSize);
  page.drawText(watermarkText, {
    x: (w - ww) / 2,
    y: h / 2 - watermarkSize / 2,
    size: watermarkSize,
    font,
    color: lightGray,
    opacity: 0.12,
  });

  // 8. Footer: "Generated by manu2print.com" small gray text
  const footerText = "Generated by manu2print.com";
  const footerSize = 6;
  const fw = font.widthOfTextAtSize(footerText, footerSize);
  page.drawText(footerText, {
    x: (w - fw) / 2,
    y: 6,
    size: footerSize,
    font,
    color: gray,
  });

  return doc.save();
}
