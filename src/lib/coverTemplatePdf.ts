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
 * Page size = widthInches × heightInches. Draws trim and spine lines.
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
  const lightGray = rgb(0.85, 0.85, 0.85);
  const thin = 0.5;
  const labelSize = 7;

  // Trim and spine x positions (left to right)
  const xLeftBleed = 0;
  const xBackTrimLeft = bleedPt;
  const xSpineLeft = bleedPt + trimW;
  const xSpineRight = bleedPt + trimW + spinePt;
  const xFrontTrimRight = bleedPt + trimW + spinePt + trimW;
  const xRightBleed = w;

  // Vertical trim
  const yBottomTrim = bleedPt;
  const yTopTrim = bleedPt + trimH;

  // Vertical lines (trim and spine boundaries)
  const drawVLine = (x: number, color = gray) => {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: h },
      color,
      thickness: thin,
    });
  };
  drawVLine(xBackTrimLeft);
  drawVLine(xSpineLeft);
  drawVLine(xSpineRight);
  drawVLine(xFrontTrimRight);

  // Horizontal trim lines
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

  // Optional: light spine zone (so designers see the spine area)
  page.drawRectangle({
    x: xSpineLeft,
    y: 0,
    width: spinePt,
    height: h,
    borderColor: lightGray,
    borderWidth: thin,
  });

  // Labels (bottom of page, centered in each zone)
  const labelY = 6;
  const center = (x1: number, x2: number) => (x1 + x2) / 2;
  const drawLabel = (text: string, xCenter: number) => {
    const tw = font.widthOfTextAtSize(text, labelSize);
    page.drawText(text, {
      x: xCenter - tw / 2,
      y: labelY,
      size: labelSize,
      font,
      color: gray,
    });
  };
  drawLabel("Back", center(xBackTrimLeft, xSpineLeft));
  drawLabel("Spine", center(xSpineLeft, xSpineRight));
  drawLabel("Front", center(xSpineRight, xFrontTrimRight));

  return doc.save();
}
