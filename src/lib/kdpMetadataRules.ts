/**
 * KDP Metadata Rules — pure client-side checker for title, subtitle, and keywords.
 *
 * Rules:
 *  - Pure functions only. No imports, no I/O, no side effects.
 *  - Advisory language: "risky", "may trigger review" — never "banned" or "will be rejected".
 *  - Returns issues with severity "error" (hard limit) or "warning" (advisory).
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type MetadataInput = {
  title: string;
  subtitle?: string;
  /** Up to 7 keyword strings. Empty strings are ignored. */
  keywords?: string[];
};

export type IssueSeverity = "error" | "warning";

export type MetadataIssue = {
  field: string;
  severity: IssueSeverity;
  message: string;
  fix: string;
};

export type FieldStatus = "pass" | "warning" | "error";

export type MetadataCheckResult = {
  issues: MetadataIssue[];
  fieldStatus: Record<string, FieldStatus>;
  issueCount: number;
  errorCount: number;
  warningCount: number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TITLE_MAX = 200;
const SUBTITLE_MAX = 200;
const KEYWORD_MAX = 50;
const CAPS_LETTER_THRESHOLD = 12;

// ── Risky promotional / restricted term patterns ──────────────────────────────

interface RiskyTerm {
  pattern: RegExp;
  message: string;
  fix: string;
}

const RISKY_TERMS: RiskyTerm[] = [
  {
    pattern: /\b#\s*1\b|number\s+one\b/i,
    message: '"#1" claims may trigger a KDP quality review',
    fix: 'Remove "#1" or "number one" unless it refers to a verified chart position. KDP may suppress listings with unverifiable ranking claims.',
  },
  {
    pattern: /\bbest[\s-]?sell(er|ing)\b/i,
    message: '"Bestseller" language may trigger a KDP review',
    fix: 'Remove "bestseller" or "bestselling." These terms require verification and are frequently flagged in metadata.',
  },
  {
    pattern: /(?<![a-z])free(?![a-z])/i,
    message: '"Free" in metadata may trigger a KDP review',
    fix: 'Avoid "free" in your title or subtitle. KDP may flag listings that use promotional pricing language in metadata.',
  },
  {
    pattern: /\bguaranteed?\b/i,
    message: '"Guaranteed" claims may trigger a KDP review',
    fix: 'Remove "guaranteed." KDP does not permit unverifiable guarantees in book metadata.',
  },
  {
    pattern: /\baward[\s-]winning\b/i,
    message: '"Award-winning" may trigger a KDP review',
    fix: 'Remove "award-winning" unless you can verify the award. KDP may request proof or suppress the listing.',
  },
  {
    pattern: /\blimited[\s-]time\b/i,
    message: '"Limited time" is promotional language not suited to metadata',
    fix: 'Remove "limited time." Promotional pricing language belongs in marketing copy, not in your permanent book title.',
  },
  {
    pattern: /\bamazon\b/i,
    message: '"Amazon" in metadata may trigger a compliance review',
    fix: 'Remove "Amazon." Using competitor or platform brand names in book titles can trigger KDP policy flags.',
  },
  {
    pattern: /\bkindle\b/i,
    message: '"Kindle" in metadata may trigger a compliance review',
    fix: 'Remove "Kindle." Platform brand names in book titles may violate KDP\'s content guidelines.',
  },
  {
    pattern: /\b(new\s+york\s+times|nyt)\b/i,
    message: '"New York Times" reference may trigger a KDP review',
    fix: 'Remove the NYT reference unless the claim is verifiable and current. Unverified bestseller list claims are frequently flagged.',
  },
  {
    pattern: /\bmust[\s-]read\b/i,
    message: '"Must-read" is a subjective claim that may trigger review',
    fix: 'Remove "must-read." Subjective superlatives in metadata can be flagged as misleading.',
  },
  {
    pattern: /\bmiracle\b/i,
    message: '"Miracle" language in metadata may trigger a review',
    fix: 'Remove "miracle." Especially in health or wellness categories, this term can trigger a KDP content review.',
  },
  {
    pattern: /\bcure[sd]?\b/i,
    message: '"Cure" claims may trigger a health-content review',
    fix: 'Remove "cure" or "cures." Medical claim language in metadata is closely reviewed, particularly in health categories.',
  },
  {
    pattern: /\bclinically\s+proven\b/i,
    message: '"Clinically proven" is a medical claim that may trigger review',
    fix: 'Remove "clinically proven." Medical efficacy claims in metadata require substantiation and may cause KDP to hold your listing.',
  },
  {
    pattern: /\bdoctors?\s+recommend\b/i,
    message: '"Doctor recommended" may trigger a health-content review',
    fix: 'Remove "doctor recommended." Medical endorsement language without verification can trigger a KDP content review.',
  },
  {
    pattern: /\bget\s+rich\b|\bmake\s+money\s+fast\b/i,
    message: '"Get rich" / "make money fast" language may trigger review',
    fix: 'Reword to describe what the book actually teaches. KDP flags unrealistic financial promise language in metadata.',
  },
  {
    pattern: /\bworld[\'']?s\s+(best|#\s*1|greatest)\b/i,
    message: '"World\'s best" superlatives may trigger a review',
    fix: 'Remove superlative world-ranking claims. These are typically unverifiable and may be flagged.',
  },
];

// ── Misleading claim patterns ──────────────────────────────────────────────────

const MISLEADING_TERMS: RiskyTerm[] = [
  {
    pattern: /\bthe\s+only\b/i,
    message: '"The only" is an exclusivity claim that may trigger review',
    fix: 'Remove "the only." Exclusivity claims that cannot be verified are frequently flagged in KDP metadata.',
  },
  {
    pattern: /\bscientifically\s+proven\b/i,
    message: '"Scientifically proven" is a claim that may trigger review',
    fix: 'Remove "scientifically proven." Scientific claims in metadata require substantiation. Reword to describe the content instead.',
  },
  {
    pattern: /\bsecret[s]?\b/i,
    message: '"Secrets" language may attract additional KDP scrutiny',
    fix: 'Consider replacing "secrets" with more descriptive language. While not prohibited, this term has attracted increased review in some categories.',
  },
];

// ── Series format patterns ────────────────────────────────────────────────────

const SERIES_IN_TITLE: RiskyTerm[] = [
  {
    pattern: /\b(book|vol\.?|volume|part|episode|series)\s*[#\-–—]?\s*\d+\b/i,
    message: 'Series numbering detected in title',
    fix: 'Consider moving series info (e.g. "Book 2") to KDP\'s dedicated Series field instead. Keeping it in the title is allowed but the Series field is the preferred location.',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  a.forEach((w) => { if (b.has(w)) common++; });
  return common / Math.min(a.size, b.size);
}

function letterCount(text: string): number {
  return (text.match(/[a-zA-Z]/g) ?? []).length;
}

function isEffectivelyAllCaps(text: string): boolean {
  const letters = letterCount(text);
  if (letters < CAPS_LETTER_THRESHOLD) return false;
  return !/[a-z]/.test(text);
}

function deriveFieldStatus(
  issues: MetadataIssue[],
  field: string
): FieldStatus {
  const fieldIssues = issues.filter((i) => i.field === field);
  if (fieldIssues.some((i) => i.severity === "error")) return "error";
  if (fieldIssues.some((i) => i.severity === "warning")) return "warning";
  return "pass";
}

// ── Checkers ──────────────────────────────────────────────────────────────────

function checkCharLimit(
  field: string,
  value: string,
  max: number,
  issues: MetadataIssue[]
): void {
  if (value.length > max) {
    issues.push({
      field,
      severity: "error",
      message: `Exceeds KDP's ${max}-character limit (currently ${value.length} characters)`,
      fix: `Shorten to ${max} characters or fewer. KDP will not allow the listing to go live with this field over the limit.`,
    });
  }
}

function checkRiskyTerms(
  field: string,
  value: string,
  terms: RiskyTerm[],
  issues: MetadataIssue[]
): void {
  for (const term of terms) {
    if (term.pattern.test(value)) {
      issues.push({ field, severity: "warning", message: term.message, fix: term.fix });
    }
  }
}

function checkAllCaps(field: string, value: string, issues: MetadataIssue[]): void {
  if (isEffectivelyAllCaps(value)) {
    issues.push({
      field,
      severity: "warning",
      message: "Title appears to be in ALL CAPS",
      fix: 'Use standard title case (e.g. "The Complete Guide to KDP"). All-caps titles can appear unprofessional and may reduce click-through rates.',
    });
  }
}

function checkKeywordStuffing(
  titleWords: Set<string>,
  subtitleWords: Set<string>,
  keywords: string[],
  issues: MetadataIssue[]
): void {
  keywords.forEach((kw, i) => {
    const kwWords = wordSet(kw);
    if (kwWords.size === 0) return;
    const titleOverlap = overlapRatio(kwWords, titleWords);
    const subtitleOverlap = overlapRatio(kwWords, subtitleWords);
    if (titleOverlap >= 0.8 || subtitleOverlap >= 0.8) {
      issues.push({
        field: `keyword_${i + 1}`,
        severity: "warning",
        message: `Keyword ${i + 1} closely mirrors your title or subtitle`,
        fix: "KDP already indexes your title and subtitle automatically. Using the same words in keyword fields wastes valuable keyword space. Use this field for different search terms readers might use.",
      });
    }
  });
}

function checkSubtitleDuplication(
  titleWords: Set<string>,
  subtitle: string,
  issues: MetadataIssue[]
): void {
  const subtitleWords = wordSet(subtitle);
  if (subtitleWords.size < 3) return;
  const overlap = overlapRatio(subtitleWords, titleWords);
  if (overlap >= 0.7) {
    issues.push({
      field: "subtitle",
      severity: "warning",
      message: "Subtitle closely repeats your title",
      fix: "Use the subtitle to add new information — a different angle, the audience, or the core benefit. Repeating title words wastes valuable metadata space and may reduce discoverability.",
    });
  }
}

function checkKeywordDuplication(keywords: string[], issues: MetadataIssue[]): void {
  const seen: Map<string, number> = new Map();
  keywords.forEach((kw, i) => {
    const normalised = kw.trim().toLowerCase();
    if (!normalised) return;
    if (seen.has(normalised)) {
      issues.push({
        field: `keyword_${i + 1}`,
        severity: "warning",
        message: `Keyword ${i + 1} is a duplicate of keyword ${(seen.get(normalised) ?? 0) + 1}`,
        fix: "Replace duplicate keywords with distinct search terms. Each keyword field is an opportunity to reach different readers.",
      });
    } else {
      seen.set(normalised, i);
    }
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export function checkKdpMetadata(input: MetadataInput): MetadataCheckResult {
  const issues: MetadataIssue[] = [];

  const title = input.title.trim();
  const subtitle = (input.subtitle ?? "").trim();
  const keywords = (input.keywords ?? []).map((k) => k.trim());
  const activeKeywords = keywords.filter((k) => k.length > 0);

  // ── Title checks ────────────────────────────────────────────────────────────
  if (title.length === 0) {
    issues.push({
      field: "title",
      severity: "error",
      message: "Title is required",
      fix: "Enter your book's title as it will appear on the KDP listing.",
    });
  } else {
    checkCharLimit("title", title, TITLE_MAX, issues);
    checkRiskyTerms("title", title, RISKY_TERMS, issues);
    checkRiskyTerms("title", title, MISLEADING_TERMS, issues);
    checkRiskyTerms("title", title, SERIES_IN_TITLE, issues);
    checkAllCaps("title", title, issues);
  }

  // ── Subtitle checks ─────────────────────────────────────────────────────────
  if (subtitle.length > 0) {
    checkCharLimit("subtitle", subtitle, SUBTITLE_MAX, issues);
    checkRiskyTerms("subtitle", subtitle, RISKY_TERMS, issues);
    checkRiskyTerms("subtitle", subtitle, MISLEADING_TERMS, issues);

    if (title.length > 0) {
      checkSubtitleDuplication(wordSet(title), subtitle, issues);
    }
  }

  // ── Keyword checks ──────────────────────────────────────────────────────────
  keywords.forEach((kw, i) => {
    if (kw.length === 0) return;
    checkCharLimit(`keyword_${i + 1}`, kw, KEYWORD_MAX, issues);
    checkRiskyTerms(`keyword_${i + 1}`, kw, RISKY_TERMS, issues);
  });

  if (activeKeywords.length > 0 && title.length > 0) {
    checkKeywordStuffing(wordSet(title), wordSet(subtitle), keywords, issues);
  }

  if (activeKeywords.length > 1) {
    checkKeywordDuplication(keywords, issues);
  }

  // ── Field status map ────────────────────────────────────────────────────────
  const allFields = [
    "title",
    ...(subtitle ? ["subtitle"] : []),
    ...keywords.map((_, i) => `keyword_${i + 1}`).filter((_, i) => keywords[i].length > 0),
  ];

  const fieldStatus: Record<string, FieldStatus> = {};
  allFields.forEach((f) => {
    fieldStatus[f] = deriveFieldStatus(issues, f);
  });

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return {
    issues,
    fieldStatus,
    issueCount: issues.length,
    errorCount,
    warningCount,
  };
}
