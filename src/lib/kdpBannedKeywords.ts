/**
 * KDP banned / high-risk metadata terms.
 * Organized by category with risk levels and explanations.
 * Amazon does not publish a complete list — this is curated from known violations and community reports.
 */

export type RiskCategory =
  | "promotional"
  | "trademark"
  | "platform"
  | "false_claim"
  | "health_claim"
  | "contact"
  | "stuffing";

export type RiskLevel = "high" | "medium";

export interface RiskyTerm {
  phrase: string;
  category: RiskCategory;
  level: RiskLevel;
}

export const CATEGORY_LABELS: Record<RiskCategory, string> = {
  promotional:  "Promotional language",
  trademark:    "Amazon trademark",
  platform:     "Competitor / platform reference",
  false_claim:  "False or unverifiable claim",
  health_claim: "Prohibited health/product claim",
  contact:      "Contact info / external link",
  stuffing:     "Keyword stuffing",
};

export const CATEGORY_REASON: Record<RiskCategory, string> = {
  promotional:  "KDP prohibits promotional language (prices, sales, discounts) in metadata.",
  trademark:    "Amazon trademarks cannot be used in book titles or descriptions without authorization.",
  platform:     "References to competing platforms or retailers are not permitted in KDP metadata.",
  false_claim:  "Unverifiable superlatives and guarantees conflict with KDP content guidelines.",
  health_claim: "Medical/health claims and certain product-related terms are prohibited in KDP metadata.",
  contact:      "URLs, email addresses, and calls to visit external sites are not allowed in metadata.",
  stuffing:     "Generic gift or keyword-stuffing phrases are flagged by KDP's listing quality filters.",
};

export const RISKY_TERMS: RiskyTerm[] = [
  // ── Promotional ──────────────────────────────────
  { phrase: "bestseller",           category: "promotional", level: "high"   },
  { phrase: "best seller",          category: "promotional", level: "high"   },
  { phrase: "best-seller",          category: "promotional", level: "high"   },
  { phrase: "#1 best seller",       category: "promotional", level: "high"   },
  { phrase: "#1 bestseller",        category: "promotional", level: "high"   },
  { phrase: "#1",                   category: "promotional", level: "medium" },
  { phrase: "number one seller",    category: "promotional", level: "high"   },
  { phrase: "free gift",            category: "promotional", level: "high"   },
  { phrase: "free shipping",        category: "promotional", level: "high"   },
  { phrase: "free bonus",           category: "promotional", level: "high"   },
  { phrase: "buy now",              category: "promotional", level: "high"   },
  { phrase: "order now",            category: "promotional", level: "high"   },
  { phrase: "shop now",             category: "promotional", level: "high"   },
  { phrase: "on sale",              category: "promotional", level: "high"   },
  { phrase: "special offer",        category: "promotional", level: "high"   },
  { phrase: "limited time",         category: "promotional", level: "high"   },
  { phrase: "limited time offer",   category: "promotional", level: "high"   },
  { phrase: "black friday",         category: "promotional", level: "high"   },
  { phrase: "cyber monday",         category: "promotional", level: "high"   },
  { phrase: "clearance",            category: "promotional", level: "high"   },
  { phrase: "reduced price",        category: "promotional", level: "high"   },
  { phrase: "marked down",          category: "promotional", level: "high"   },
  { phrase: "half price",           category: "promotional", level: "high"   },
  { phrase: "discounted",           category: "promotional", level: "medium" },
  { phrase: "new release",          category: "promotional", level: "medium" },

  // ── Amazon trademarks ────────────────────────────
  { phrase: "kindle unlimited",     category: "trademark", level: "high"   },
  { phrase: "kindle edition",       category: "trademark", level: "high"   },
  { phrase: "kindle",               category: "trademark", level: "high"   },
  { phrase: "audible",              category: "trademark", level: "high"   },
  { phrase: "audible audiobook",    category: "trademark", level: "high"   },
  { phrase: "amazon's choice",      category: "trademark", level: "high"   },
  { phrase: "amazon choice",        category: "trademark", level: "high"   },
  { phrase: "amazon prime",         category: "trademark", level: "high"   },
  { phrase: "amazon",               category: "trademark", level: "medium" },
  { phrase: "alexa",                category: "trademark", level: "medium" },
  { phrase: "goodreads",            category: "trademark", level: "medium" },

  // ── Competitor / platform references ─────────────
  { phrase: "apple books",          category: "platform", level: "high"   },
  { phrase: "ibooks",               category: "platform", level: "high"   },
  { phrase: "barnes & noble",       category: "platform", level: "high"   },
  { phrase: "barnes and noble",     category: "platform", level: "high"   },
  { phrase: "kobo",                 category: "platform", level: "high"   },
  { phrase: "smashwords",           category: "platform", level: "high"   },
  { phrase: "nook",                 category: "platform", level: "high"   },
  { phrase: "draft2digital",        category: "platform", level: "high"   },
  { phrase: "draft 2 digital",      category: "platform", level: "high"   },
  { phrase: "google play",          category: "platform", level: "high"   },
  { phrase: "google books",         category: "platform", level: "high"   },
  { phrase: "scribd",               category: "platform", level: "high"   },
  { phrase: "wattpad",              category: "platform", level: "medium" },
  { phrase: "lulu",                 category: "platform", level: "medium" },
  { phrase: "ingram",               category: "platform", level: "medium" },
  { phrase: "ingramspark",          category: "platform", level: "medium" },

  // ── False or unverifiable claims ─────────────────
  { phrase: "money back guarantee", category: "false_claim", level: "high"   },
  { phrase: "100% guarantee",       category: "false_claim", level: "high"   },
  { phrase: "guaranteed",           category: "false_claim", level: "high"   },
  { phrase: "scientifically proven",category: "false_claim", level: "high"   },
  { phrase: "clinically proven",    category: "false_claim", level: "high"   },
  { phrase: "clinically tested",    category: "false_claim", level: "high"   },
  { phrase: "doctor recommended",   category: "false_claim", level: "high"   },
  { phrase: "doctor approved",      category: "false_claim", level: "high"   },
  { phrase: "physician recommended",category: "false_claim", level: "high"   },
  { phrase: "fda approved",         category: "false_claim", level: "high"   },
  { phrase: "fda cleared",          category: "false_claim", level: "high"   },
  { phrase: "fda registered",       category: "false_claim", level: "high"   },
  { phrase: "award winning",        category: "false_claim", level: "medium" },
  { phrase: "award-winning",        category: "false_claim", level: "medium" },
  { phrase: "world's best",         category: "false_claim", level: "high"   },
  { phrase: "the best book",        category: "false_claim", level: "medium" },
  { phrase: "life changing",        category: "false_claim", level: "medium" },
  { phrase: "life-changing",        category: "false_claim", level: "medium" },

  // ── Health / product claims ───────────────────────
  { phrase: "cbd",                  category: "health_claim", level: "high"   },
  { phrase: "hemp oil",             category: "health_claim", level: "high"   },
  { phrase: "hemp extract",         category: "health_claim", level: "high"   },
  { phrase: "thc",                  category: "health_claim", level: "high"   },
  { phrase: "marijuana",            category: "health_claim", level: "high"   },
  { phrase: "cannabis",             category: "health_claim", level: "high"   },
  { phrase: "anti-bacterial",       category: "health_claim", level: "high"   },
  { phrase: "antibacterial",        category: "health_claim", level: "high"   },
  { phrase: "anti-microbial",       category: "health_claim", level: "high"   },
  { phrase: "antimicrobial",        category: "health_claim", level: "high"   },
  { phrase: "anti-fungal",          category: "health_claim", level: "high"   },
  { phrase: "antifungal",           category: "health_claim", level: "high"   },
  { phrase: "antiseptic",           category: "health_claim", level: "high"   },
  { phrase: "non-toxic",            category: "health_claim", level: "high"   },
  { phrase: "nontoxic",             category: "health_claim", level: "high"   },
  { phrase: "repellent",            category: "health_claim", level: "high"   },
  { phrase: "cures",                category: "health_claim", level: "high"   },
  { phrase: "treats disease",       category: "health_claim", level: "high"   },
  { phrase: "heals",                category: "health_claim", level: "medium" },

  // ── Contact info / external links ────────────────
  { phrase: "www.",                 category: "contact", level: "high"   },
  { phrase: ".com",                 category: "contact", level: "high"   },
  { phrase: ".net",                 category: "contact", level: "high"   },
  { phrase: ".org",                 category: "contact", level: "high"   },
  { phrase: "follow us",            category: "contact", level: "high"   },
  { phrase: "follow me",            category: "contact", level: "high"   },
  { phrase: "subscribe",            category: "contact", level: "medium" },
  { phrase: "newsletter",           category: "contact", level: "medium" },
  { phrase: "sign up",              category: "contact", level: "medium" },
  { phrase: "visit our",            category: "contact", level: "high"   },
  { phrase: "visit us",             category: "contact", level: "high"   },
  { phrase: "contact us",           category: "contact", level: "high"   },
  { phrase: "email us",             category: "contact", level: "high"   },

  // ── Keyword stuffing ─────────────────────────────
  { phrase: "perfect gift for",     category: "stuffing", level: "medium" },
  { phrase: "great gift for",       category: "stuffing", level: "medium" },
  { phrase: "gifts for",            category: "stuffing", level: "medium" },
  { phrase: "gift for",             category: "stuffing", level: "medium" },
  { phrase: "ideal gift",           category: "stuffing", level: "medium" },
  { phrase: "best gift",            category: "stuffing", level: "medium" },
  { phrase: "buy this book",        category: "stuffing", level: "high"   },
  { phrase: "must read",            category: "stuffing", level: "medium" },
  { phrase: "must-read",            category: "stuffing", level: "medium" },
  { phrase: "page turner",          category: "stuffing", level: "medium" },
  { phrase: "page-turner",          category: "stuffing", level: "medium" },
  { phrase: "can't put it down",    category: "stuffing", level: "medium" },
  { phrase: "for fans of",          category: "stuffing", level: "medium" },
  { phrase: "fans of",              category: "stuffing", level: "medium" },
  { phrase: "if you liked",         category: "stuffing", level: "medium" },
];

export const BANNED_PHRASES: string[] = RISKY_TERMS.map((t) => t.phrase);

/**
 * Check text fields for risky phrases.
 * Returns enriched results with category, level, and explanation.
 */
export function checkBannedKeywords(
  title: string,
  subtitle: string,
  description: string
): {
  phrase: string;
  field: "title" | "subtitle" | "description";
  category: RiskCategory;
  level: RiskLevel;
  reason: string;
  categoryLabel: string;
}[] {
  const results: {
    phrase: string;
    field: "title" | "subtitle" | "description";
    category: RiskCategory;
    level: RiskLevel;
    reason: string;
    categoryLabel: string;
  }[] = [];

  const fields: { key: "title" | "subtitle" | "description"; text: string }[] = [
    { key: "title",       text: title.trim().toLowerCase()       },
    { key: "subtitle",    text: subtitle.trim().toLowerCase()    },
    { key: "description", text: description.trim().toLowerCase() },
  ];

  for (const term of RISKY_TERMS) {
    for (const field of fields) {
      if (field.text && field.text.includes(term.phrase)) {
        results.push({
          phrase: term.phrase,
          field: field.key,
          category: term.category,
          level: term.level,
          reason: CATEGORY_REASON[term.category],
          categoryLabel: CATEGORY_LABELS[term.category],
        });
      }
    }
  }

  return results;
}
