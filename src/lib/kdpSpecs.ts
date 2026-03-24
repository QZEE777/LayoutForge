/**
 * Amazon KDP (Kindle Direct Publishing) print and ebook specifications.
 * Includes trim sizes, margins, bleed values, and calculations.
 */

export const KDP_TRIM_SIZES = [
  { id: "5x8",       name: "5\" × 8\"",         widthInches: 5,    heightInches: 8    },
  { id: "5.06x7.81", name: "5.06\" × 7.81\"",   widthInches: 5.06, heightInches: 7.81 },
  { id: "5.25x8",    name: "5.25\" × 8\"",       widthInches: 5.25, heightInches: 8    },
  { id: "5.5x8.5",   name: "5.5\" × 8.5\"",      widthInches: 5.5,  heightInches: 8.5  },
  { id: "6x9",       name: "6\" × 9\"",           widthInches: 6,    heightInches: 9    },
  { id: "6.14x9.21", name: "6.14\" × 9.21\"",    widthInches: 6.14, heightInches: 9.21 },
  { id: "6.69x9.61", name: "6.69\" × 9.61\"",    widthInches: 6.69, heightInches: 9.61 },
  { id: "7x10",      name: "7\" × 10\"",          widthInches: 7,    heightInches: 10   },
  { id: "7.44x9.69", name: "7.44\" × 9.69\"",    widthInches: 7.44, heightInches: 9.69 },
  { id: "7.5x9.25",  name: "7.5\" × 9.25\"",     widthInches: 7.5,  heightInches: 9.25 },
  { id: "8x10",      name: "8\" × 10\"",          widthInches: 8,    heightInches: 10   },
  { id: "8.25x8.25", name: "8.25\" × 8.25\"",    widthInches: 8.25, heightInches: 8.25 },
  { id: "8.5x8.5",   name: "8.5\" × 8.5\"",      widthInches: 8.5,  heightInches: 8.5  },
  { id: "8.5x11",    name: "8.5\" × 11\"",        widthInches: 8.5,  heightInches: 11   },
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
    "5x8":       250,
    "5.06x7.81": 240,
    "5.25x8":    255,
    "5.5x8.5":   280,
    "6x9":       300,
    "6.14x9.21": 310,
    "6.69x9.61": 330,
    "7x10":      370,
    "7.44x9.69": 360,
    "7.5x9.25":  355,
    "8x10":      380,
    "8.25x8.25": 340,
    "8.5x8.5":   350,
    "8.5x11":    400,
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
