/**
 * KDP banned / high-risk keywords. Not exhaustive; Amazon does not publish a full list.
 * Used for client-side checker only. Case-insensitive whole-word or phrase match.
 */

/** Terms that often trigger listing issues or policy flags. One phrase per line. */
const RAW_TERMS = `
best seller
bestseller
#1 best seller
free gift
free shipping
kindle unlimited
audible
audiobook
buy now
black friday
special offer
limited time
amazon's choice
money back guarantee
100% guarantee
anti-bacterial
antibacterial
anti-microbial
antimicrobial
anti-fungal
antifungal
cbd
repellent
non-toxic
nontoxic
antiseptic
`.trim();

/** Normalized: lowercase, one phrase per entry. */
export const BANNED_PHRASES: string[] = RAW_TERMS
  .split(/\n/)
  .map((line) => line.trim().toLowerCase())
  .filter(Boolean);

/**
 * Check text for banned phrases. Returns list of { phrase, field } for each match.
 */
export function checkBannedKeywords(
  title: string,
  subtitle: string,
  description: string
): { phrase: string; field: "title" | "subtitle" | "description" }[] {
  const results: { phrase: string; field: "title" | "subtitle" | "description" }[] = [];
  const lowerTitle = title.trim().toLowerCase();
  const lowerSubtitle = subtitle.trim().toLowerCase();
  const lowerDesc = description.trim().toLowerCase();

  for (const phrase of BANNED_PHRASES) {
    if (!phrase) continue;
    if (lowerTitle.includes(phrase)) results.push({ phrase, field: "title" });
    if (lowerSubtitle.includes(phrase)) results.push({ phrase, field: "subtitle" });
    if (lowerDesc.includes(phrase)) results.push({ phrase, field: "description" });
  }

  return results;
}
