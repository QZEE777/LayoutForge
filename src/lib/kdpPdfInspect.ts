/**
 * Shared PDF inspection for checker flows: page count and trim from first page (pdf-lib).
 * Keeps async Print Ready Check aligned with the synchronous /api/kdp-pdf-check path.
 *
 * Trim dimensions use the PDF **TrimBox** (via pdf-lib getTrimBox), not getSize()/MediaBox.
 * Print PDFs with bleed often have a larger media box; TrimBox still reflects KDP trim size.
 */
import { PDFDocument, type PDFPage } from "pdf-lib";
import { TRIM_SIZES } from "./kdpConfig";

const PT_PER_INCH = 72;
const TOLERANCE_INCH = 0.05;

function inchesFromPt(pt: number): number {
  return Math.round((pt / PT_PER_INCH) * 100) / 100;
}

function matchTrimAtOrientation(
  widthIn: number,
  heightIn: number
): { id: string; name: string } | null {
  for (const t of TRIM_SIZES) {
    const wOk = Math.abs(widthIn - t.widthInches) <= TOLERANCE_INCH;
    const hOk = Math.abs(heightIn - t.heightInches) <= TOLERANCE_INCH;
    if (wOk && hOk) return { id: t.id, name: t.name };
  }
  return null;
}

/** Match KDP trim; tries portrait and landscape (same trim, 90°). */
export function findKdpTrim(widthIn: number, heightIn: number): { id: string; name: string } | null {
  return matchTrimAtOrientation(widthIn, heightIn) ?? matchTrimAtOrientation(heightIn, widthIn);
}

/** Width/height in inches from the page TrimBox (KDP-relevant size, not bleed media size). */
export function trimBoxSizeInches(page: PDFPage): { widthIn: number; heightIn: number } {
  const { width: wPt, height: hPt } = page.getTrimBox();
  return { widthIn: inchesFromPt(wPt), heightIn: inchesFromPt(hPt) };
}

export interface CheckerPdfInspectResult {
  pageCount: number;
  trimDetected: string;
  /** First-page TrimBox dimensions in inches (portrait orientation as stored in PDF). */
  trimWidthIn: number;
  trimHeightIn: number;
  trimMatchKDP: boolean;
  kdpTrimName: string | null;
  trimSize: string;
}

/**
 * Load PDF bytes and read page count + first-page dimensions for KDP trim matching.
 * Returns null if the file cannot be read (corrupt/encrypted).
 */
export async function inspectPdfBufferForChecker(buffer: Buffer): Promise<CheckerPdfInspectResult | null> {
  try {
    const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    const firstPage = doc.getPage(0);
    const { widthIn, heightIn } = trimBoxSizeInches(firstPage);
    const kdpTrim = findKdpTrim(widthIn, heightIn);
    return {
      pageCount,
      trimDetected: `${widthIn}" × ${heightIn}"`,
      trimWidthIn: widthIn,
      trimHeightIn: heightIn,
      trimMatchKDP: !!kdpTrim,
      kdpTrimName: kdpTrim?.name ?? null,
      trimSize: kdpTrim ? kdpTrim.id : `${widthIn}x${heightIn}`,
    };
  } catch {
    return null;
  }
}
