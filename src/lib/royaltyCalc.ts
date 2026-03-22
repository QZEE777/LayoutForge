/**
 * KDP royalty and print cost calculations (US paperback, simplified).
 * Print cost = fixed + (page count × per-page rate). Royalty = (list price - print cost) × rate.
 * Per-page rate varies by ink/paper type. Source: KDP print cost calculator (US marketplace).
 */

export const ROYALTY_RATES = [
  { id: "60", label: "60%", value: 0.6 },
  { id: "35", label: "35%", value: 0.35 },
] as const;

/**
 * Interior ink + paper type options.
 * B&W white and cream paper cost the same per page on KDP US.
 * Color interior is significantly more expensive.
 */
export const PAPER_COLOR_OPTIONS = [
  { id: "bw-white", label: "B&W — White Paper",  perPageUsd: 0.012 },
  { id: "bw-cream", label: "B&W — Cream Paper",  perPageUsd: 0.012 },
  { id: "color",    label: "Color Interior",      perPageUsd: 0.07  },
] as const;

export type PaperColorId = (typeof PAPER_COLOR_OPTIONS)[number]["id"];

/** Trim sizes supported for print cost (matches KDP trim options). Fixed cost varies by trim. */
export const ROYALTY_TRIM_SIZES = [
  { id: "5x8",     name: '5" × 8"',     fixedUsd: 0.85 },
  { id: "5.5x8.5", name: '5.5" × 8.5"', fixedUsd: 0.90 },
  { id: "6x9",     name: '6" × 9"',     fixedUsd: 1.00 },
  { id: "8.5x11",  name: '8.5" × 11"',  fixedUsd: 1.15 },
] as const;

export type RoyaltyTrimId = (typeof ROYALTY_TRIM_SIZES)[number]["id"];

/** Get trim config by id. */
export function getRoyaltyTrim(id: RoyaltyTrimId) {
  return ROYALTY_TRIM_SIZES.find((t) => t.id === id) ?? ROYALTY_TRIM_SIZES[2];
}

/** Get paper color config by id. */
export function getPaperColor(id: PaperColorId) {
  return PAPER_COLOR_OPTIONS.find((p) => p.id === id) ?? PAPER_COLOR_OPTIONS[0];
}

/** KDP minimum page count. */
export const MIN_PAGES = 24;
/** KDP max page count (paperback). */
export const MAX_PAGES = 828;

/**
 * Compute print cost (US paperback).
 * Fixed cost is determined by trim size; per-page cost by ink/paper type.
 */
export function getPrintCostUsd(
  trimId: RoyaltyTrimId,
  pageCount: number,
  paperColorId: PaperColorId = "bw-white"
): number {
  const trim = getRoyaltyTrim(trimId);
  const paper = getPaperColor(paperColorId);
  const pages = Math.max(MIN_PAGES, Math.min(MAX_PAGES, Math.round(pageCount)));
  return trim.fixedUsd + pages * paper.perPageUsd;
}

/**
 * Compute royalty per sale (before any referral/minimum list price checks).
 * Returns 0 if list price is below print cost.
 */
export function getRoyaltyUsd(
  listPriceUsd: number,
  printCostUsd: number,
  rate: number
): number {
  if (listPriceUsd <= 0) return 0;
  const afterCost = listPriceUsd - printCostUsd;
  if (afterCost <= 0) return 0;
  return Math.round(afterCost * rate * 100) / 100;
}
