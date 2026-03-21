/**
 * Shared PDF inspection for checker flows: page count and trim from first page (pdf-lib).
 * Keeps async Print Ready Check aligned with the synchronous /api/kdp-pdf-check path.
 */
import { PDFDocument } from "pdf-lib";
import { TRIM_SIZES } from "./kdpConfig";

const PT_PER_INCH = 72;
const TOLERANCE_INCH = 0.15;

function inchesFromPt(pt: number): number {
  return Math.round((pt / PT_PER_INCH) * 100) / 100;
}

export function findKdpTrim(widthIn: number, heightIn: number): { id: string; name: string } | null {
  for (const t of TRIM_SIZES) {
    const wOk = Math.abs(widthIn - t.widthInches) <= TOLERANCE_INCH;
    const hOk = Math.abs(heightIn - t.heightInches) <= TOLERANCE_INCH;
    if (wOk && hOk) return { id: t.id, name: t.name };
  }
  return null;
}

export interface CheckerPdfInspectResult {
  pageCount: number;
  trimDetected: string;
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
    const { width: wPt, height: hPt } = firstPage.getSize();
    const widthIn = inchesFromPt(wPt);
    const heightIn = inchesFromPt(hPt);
    const kdpTrim = findKdpTrim(widthIn, heightIn);
    return {
      pageCount,
      trimDetected: `${widthIn}" × ${heightIn}"`,
      trimMatchKDP: !!kdpTrim,
      kdpTrimName: kdpTrim?.name ?? null,
      trimSize: kdpTrim ? kdpTrim.id : `${widthIn}x${heightIn}`,
    };
  } catch {
    return null;
  }
}
