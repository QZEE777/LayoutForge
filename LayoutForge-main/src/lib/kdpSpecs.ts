/**
 * Amazon KDP (Kindle Direct Publishing) print and ebook specifications.
 * Includes trim sizes, margins, bleed values, and calculations.
 */

export const KDP_TRIM_SIZES = [
  { id: "5x8", name: "5\" × 8\"", widthInches: 5, heightInches: 8 },
  { id: "5.5x8.5", name: "5.5\" × 8.5\"", widthInches: 5.5, heightInches: 8.5 },
  { id: "6x9", name: "6\" × 9\"", widthInches: 6, heightInches: 9 },
  { id: "8.5x11", name: "8.5\" × 11\"", widthInches: 8.5, heightInches: 11 },
] as const;

export type TrimSizeId = (typeof KDP_TRIM_SIZES)[number]["id"];

/** Bleed: 0.125" (3.2mm) on all edges for full-bleed images. */
export const KDP_BLEED_INCHES = 0.125;

/** Minimum margins (in inches). */
export const KDP_MARGINS = {
  minOutside: 0.25, // top, bottom, right edge
  minGutter: 0.375, // left/inside margin (increases with page count)
  minWithBleed: 0.375, // top, bottom, right with bleed
} as const;

/** Gutter (inside margin) increases with page count. */
export function getGutterMargin(pageCount: number): number {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.5;
  if (pageCount <= 500) return 0.625;
  if (pageCount <= 700) return 0.75;
  return 0.875;
}

/** Calculate spine width in inches (for cover design). */
export function calculateSpineWidth(
  pageCount: number,
  paperWeight: "standard" | "cream" = "standard"
): number {
  const pagesPerInch = paperWeight === "cream" ? 300 : 350;
  return pageCount / pagesPerInch;
}

/** Get trim size by ID. */
export function getTrimSize(id: TrimSizeId) {
  return KDP_TRIM_SIZES.find((t) => t.id === id);
}

/** Page dimensions with optional bleed. */
export function getPageDimensions(
  trimId: TrimSizeId,
  withBleed: boolean
): { widthInches: number; heightInches: number } {
  const trim = getTrimSize(trimId);
  if (!trim) throw new Error(`Unknown trim size: ${trimId}`);

  if (!withBleed) {
    return { widthInches: trim.widthInches, heightInches: trim.heightInches };
  }

  const bleedTotal = 2 * KDP_BLEED_INCHES;
  return {
    widthInches: trim.widthInches + bleedTotal,
    heightInches: trim.heightInches + bleedTotal,
  };
}

/** Convert inches to PDF points (72 points per inch). */
export function inchesToPoints(inches: number): number {
  return inches * 72;
}

/** Convert PDF points to inches. */
export function pointsToInches(points: number): number {
  return points / 72;
}

/** Estimate page count from word count and trim size. */
export function estimatePageCount(
  wordCount: number,
  trimId: TrimSizeId,
  fontSize: number = 11
): number {
  const wordsPerPage: Record<TrimSizeId, number> = {
    "5x8": 250,
    "5.5x8.5": 280,
    "6x9": 300,
    "8.5x11": 400,
  };

  const wpp = wordsPerPage[trimId] || 300;
  return Math.max(24, Math.ceil(wordCount / wpp));
}

export const KDP_PAGE_LIMITS = {
  minPages: 24,
  maxPages: 828,
} as const;

export const FONT_SIZES = {
  body: 10,
  bodyLarge: 11,
  bodySmall: 9,
  heading1: 16,
  heading2: 14,
  heading3: 12,
} as const;

export const LINE_HEIGHT_MULTIPLIER = 1.5;
