/**
 * KDP spine width and full-wrap cover dimensions.
 * Spine = page count × thickness per page (varies by paper type).
 * Full wrap = front + spine + back + bleed (0.125" each edge).
 */

import { KDP_TRIM_SIZES, KDP_BLEED_INCHES, type TrimSizeId } from "@/lib/kdpSpecs";
import { MIN_PAGES, MAX_PAGES } from "@/lib/royaltyCalc";

/** Inches of spine per interior page (KDP paperback). */
export const SPINE_PER_PAGE: Record<PaperType, number> = {
  "bw-white": 0.002252,
  "bw-cream": 0.0025,
  "color": 0.002252,
};

export type PaperType = "bw-white" | "bw-cream" | "color";

export const PAPER_OPTIONS: { id: PaperType; label: string }[] = [
  { id: "bw-white", label: "B&W (white paper)" },
  { id: "bw-cream", label: "B&W (cream paper)" },
  { id: "color", label: "Color interior" },
];

export function getSpineWidthInches(pageCount: number, paperType: PaperType): number {
  const pages = Math.max(MIN_PAGES, Math.min(MAX_PAGES, Math.round(pageCount)));
  return pages * SPINE_PER_PAGE[paperType];
}

export function getFullWrapDimensions(
  trimWidthInches: number,
  trimHeightInches: number,
  spineWidthInches: number
): { widthInches: number; heightInches: number } {
  const bleed = KDP_BLEED_INCHES;
  return {
    widthInches: trimWidthInches * 2 + spineWidthInches + bleed * 2,
    heightInches: trimHeightInches + bleed * 2,
  };
}

export function getTrimSize(trimId: TrimSizeId) {
  return KDP_TRIM_SIZES.find((t) => t.id === trimId);
}

export { KDP_TRIM_SIZES, MIN_PAGES, MAX_PAGES };
export type { TrimSizeId };
