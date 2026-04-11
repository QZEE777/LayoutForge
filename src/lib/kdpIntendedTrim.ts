/**
 * Optional "intended KDP trim" from the checker upload — used only to label the spec table
 * and compare detected TrimBox to the author's declared target (same tolerance as trim detection).
 */
import { HARDCOVER_TRIM_SIZES, TRIM_SIZES } from "./kdpConfig";

export const INTENDED_TRIM_MATCH_TOLERANCE_IN = 0.05;

const ALL_IDS = new Set<string>([
  ...TRIM_SIZES.map((t) => t.id),
  ...HARDCOVER_TRIM_SIZES.map((t) => t.id),
]);

export function isValidIntendedTrimId(id: string): boolean {
  if (!id || id.trim() === "") return false;
  return ALL_IDS.has(id.trim());
}

export function getKdpTrimDefinitionById(id: string): {
  w: number;
  h: number;
  labelShort: string;
  catalogName: string;
} | null {
  const trimmed = id.trim();
  const pb = TRIM_SIZES.find((t) => t.id === trimmed);
  if (pb) {
    return {
      w: pb.widthInches,
      h: pb.heightInches,
      labelShort: `${pb.widthInches}" × ${pb.heightInches}"`,
      catalogName: pb.name,
    };
  }
  const hc = HARDCOVER_TRIM_SIZES.find((t) => t.id === trimmed);
  if (hc) {
    return {
      w: hc.widthInches,
      h: hc.heightInches,
      labelShort: `${hc.widthInches}" × ${hc.heightInches}"`,
      catalogName: hc.name,
    };
  }
  return null;
}

export function dimensionsMatchIntendedTrim(
  widthIn: number,
  heightIn: number,
  targetW: number,
  targetH: number,
  tol = INTENDED_TRIM_MATCH_TOLERANCE_IN
): boolean {
  const portrait =
    Math.abs(widthIn - targetW) <= tol && Math.abs(heightIn - targetH) <= tol;
  const landscape =
    Math.abs(widthIn - targetH) <= tol && Math.abs(heightIn - targetW) <= tol;
  return portrait || landscape;
}
