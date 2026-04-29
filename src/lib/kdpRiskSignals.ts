/**
 * KDP Risk Signals — advisory content-pattern detector.
 *
 * ARCHITECTURE RULES (enforced here):
 *  - Pure functions only. No side effects, no I/O, no imports.
 *  - Returns null when confidence is low. No guessing, no noise.
 *  - Max 3 signals returned. No scoring, no ranking, no percentages.
 *  - NEVER mixed with the formatting score. Displayed as a separate layer.
 *
 * Signals are ADVISORY. Copy must use "may", "can be", "detected" — never "will" or "fails".
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type PageContent = {
  pageNumber: number;
  text: string;
  wordCount: number;
};

export type RiskSignalType = "toc_mismatch" | "duplicate_content" | "low_density";

export type RiskSignal = {
  type: RiskSignalType;
  message: string;
  /** Why this matters — shown in expandable detail. */
  whyItMatters: string;
  /** What to check — actionable guidance. */
  whatToCheck: string;
};

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Strip punctuation, collapse whitespace, lowercase. */
function normalisePage(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Jaccard word-overlap similarity (0–1).
 * Only considers words longer than 3 chars to ignore stop-words.
 */
function jaccardSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const wordsA = new Set(a.split(" ").filter((w) => w.length > 3));
  const wordsB = new Set(b.split(" ").filter((w) => w.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) intersection++; });
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Detector 1: TOC Mismatch ──────────────────────────────────────────────────

/**
 * Looks for a Table of Contents page, extracts entry labels, then checks
 * whether those labels appear in the body. Flags only on HIGH confidence —
 * requires a real TOC with ≥3 entries AND fewer than half appearing in body.
 */
function detectTocMismatch(pages: PageContent[]): RiskSignal | null {
  if (pages.length < 4) return null;

  // Find the TOC page (must contain "table of contents" explicitly)
  const tocIdx = pages.findIndex((p) =>
    /table\s+of\s+contents/i.test(p.text)
  );
  if (tocIdx === -1) return null;

  const tocText = pages[tocIdx].text;

  // Extract TOC entries: lines of the pattern "<label> ... <number>"
  const entries = tocText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^.{4,60}\s+\d{1,4}$/.test(l))
    .map((l) => l.replace(/\s+\d{1,4}$/, "").trim().toLowerCase())
    .filter((l) => l.length > 3);

  // Need at least 3 entries to be confident this is a real TOC
  if (entries.length < 3) return null;

  // Body = all pages except the TOC page itself
  const bodyText = pages
    .filter((_, i) => i !== tocIdx)
    .map((p) => p.text.toLowerCase())
    .join("\n");

  const matchCount = entries.filter((entry) => bodyText.includes(entry)).length;
  const matchRatio = matchCount / entries.length;

  // Only flag if fewer than half the TOC entries appear in the body (high confidence)
  if (matchRatio >= 0.5) return null;

  return {
    type: "toc_mismatch",
    message: "Table of Contents may not match document structure",
    whyItMatters:
      "KDP's quality review checks whether a declared Table of Contents reflects the actual content. A mismatch can trigger a quality hold.",
    whatToCheck:
      "Open your layout file and verify every TOC entry matches a real chapter heading. Re-export after correcting any discrepancies.",
  };
}

// ── Detector 2: Duplicate Content ─────────────────────────────────────────────

/**
 * Compares normalised page text across all content pages using Jaccard similarity.
 * Flags if more than 10% of page pairs exceed 90% similarity.
 * Skips near-blank pages (< 20 words) to avoid false positives on title/blank pages.
 */
function detectDuplicateContent(pages: PageContent[]): RiskSignal | null {
  // Need enough content pages to form meaningful pairs
  const contentPages = pages.filter((p) => p.wordCount >= 20);
  if (contentPages.length < 6) return null;

  const normalised = contentPages.map((p) => normalisePage(p.text));

  let duplicatePairs = 0;
  for (let i = 0; i < normalised.length; i++) {
    for (let j = i + 1; j < normalised.length; j++) {
      if (jaccardSimilarity(normalised[i], normalised[j]) > 0.9) {
        duplicatePairs++;
      }
    }
  }

  const totalPairs = (contentPages.length * (contentPages.length - 1)) / 2;
  if (totalPairs === 0) return null;

  // Only flag if more than 10% of pairs are near-duplicates
  if (duplicatePairs / totalPairs <= 0.1) return null;

  return {
    type: "duplicate_content",
    message: "Repeated content detected across multiple pages",
    whyItMatters:
      "KDP's content quality guidelines flag books where large sections of text are repeated verbatim. This can trigger a review or rejection.",
    whatToCheck:
      "Review your manuscript for duplicated sections, repeated boilerplate, or templated pages that were not removed before export.",
  };
}

// ── Detector 3: Low Content Density ───────────────────────────────────────────

/**
 * Calculates the proportion of pages below 50 words.
 * Only flags for documents with ≥ 10 pages — short books / poetry have legitimate
 * low word counts and should not be flagged.
 * Threshold: more than 40% of pages below 50 words.
 */
function detectLowDensity(pages: PageContent[]): RiskSignal | null {
  if (pages.length < 10) return null;

  const WORD_THRESHOLD = 50;
  const lowPages = pages.filter((p) => p.wordCount < WORD_THRESHOLD);
  const ratio = lowPages.length / pages.length;

  if (ratio <= 0.4) return null;

  return {
    type: "low_density",
    message: "Many pages contain minimal text",
    whyItMatters:
      "KDP may flag books where a significant portion of pages contain very little text, particularly in non-illustrated genres. This can be interpreted as low-value content.",
    whatToCheck:
      "Check whether blank or near-blank pages are intentional (e.g. chapter breaks) or the result of a layout or export error. Remove unintentional empty pages before re-uploading.",
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run all three detectors and return up to 3 advisory signals.
 * Returns an empty array when no signals are detected — never throws.
 *
 * @param pages - Per-page content extracted from the PDF.
 */
export function getKdpRiskSignals(pages: PageContent[]): RiskSignal[] {
  if (!pages || pages.length === 0) return [];

  const signals: RiskSignal[] = [];

  try {
    const toc = detectTocMismatch(pages);
    if (toc) signals.push(toc);

    const dup = detectDuplicateContent(pages);
    if (dup) signals.push(dup);

    const density = detectLowDensity(pages);
    if (density) signals.push(density);
  } catch {
    // Detectors must never surface errors to the report pipeline.
    return [];
  }

  return signals.slice(0, 3);
}
