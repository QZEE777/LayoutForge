/**
 * KDP royalty and print cost calculations (US paperback, simplified).
 * Print cost = fixed + (page count × per-page). Royalty = (list price - print cost) × rate.
 */

export const ROYALTY_RATES = [
  { id: "60", label: "60%", value: 0.6 },
  { id: "35", label: "35%", value: 0.35 },
] as const;

/** Trim sizes supported for print cost (matches KDP trim options). */
export const ROYALTY_TRIM_SIZES = [
  { id: "5x8", name: '5" × 8"', fixedUsd: 0.85, perPageUsd: 0.012 },
  { id: "5.5x8.5", name: '5.5" × 8.5"', fixedUsd: 0.9, perPageUsd: 0.012 },
  { id: "6x9", name: '6" × 9"', fixedUsd: 1.0, perPageUsd: 0.012 },
  { id: "8.5x11", name: '8.5" × 11"', fixedUsd: 1.15, perPageUsd: 0.015 },
] as const;

export type RoyaltyTrimId = (typeof ROYALTY_TRIM_SIZES)[number]["id"];

/** Get trim config by id. */
export function getRoyaltyTrim(id: RoyaltyTrimId) {
  return ROYALTY_TRIM_SIZES.find((t) => t.id === id) ?? ROYALTY_TRIM_SIZES[2];
}

/** KDP minimum page count. */
export const MIN_PAGES = 24;
/** KDP max page count (paperback). */
export const MAX_PAGES = 828;

/**
 * Compute print cost (US B&W paperback).
 */
export function getPrintCostUsd(
  trimId: RoyaltyTrimId,
  pageCount: number
): number {
  const trim = getRoyaltyTrim(trimId);
  const pages = Math.max(MIN_PAGES, Math.min(MAX_PAGES, Math.round(pageCount)));
  return trim.fixedUsd + pages * trim.perPageUsd;
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
