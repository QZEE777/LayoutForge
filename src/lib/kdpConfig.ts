/**
 * KDP Formatter configuration: trim sizes, book types, fonts, and options.
 * Used by the config form and PDF generation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COUNT LIMITS
// ─────────────────────────────────────────────────────────────────────────────

/** KDP minimum page count for all print books. */
export const KDP_MIN_PAGES = 24;
/** KDP maximum page count for paperback books. */
export const PAPERBACK_MAX_PAGES = 828;
/** KDP maximum page count for hardcover books. */
export const HARDCOVER_MIN_PAGES = 75;
export const HARDCOVER_MAX_PAGES = 550;

// ─────────────────────────────────────────────────────────────────────────────
// SPINE TEXT THRESHOLD
// The minimum page count at which a KDP white-paper paperback spine is wide
// enough to safely place title/author text (≥ 0.75" spine width).
// White paper: 0.002252" per page → 0.75" / 0.002252 ≈ 333 pages.
// This constant represents the *practical minimum* below which we warn
// that spine text is impossible (80 pages = ~0.18" white / ~0.20" cream).
// ─────────────────────────────────────────────────────────────────────────────
export const MIN_SPINE_TEXT_PAGES = 80;

// ─────────────────────────────────────────────────────────────────────────────
// PAPERBACK TRIM SIZES (all 16 KDP-supported sizes)
// ─────────────────────────────────────────────────────────────────────────────

export const TRIM_SIZES = [
  { id: "5x8",       name: '5" × 8" — Popular fiction',            widthInches: 5,     heightInches: 8     },
  { id: "5.06x7.81", name: '5.06" × 7.81" — Digest',               widthInches: 5.06,  heightInches: 7.81  },
  { id: "5.25x8",    name: '5.25" × 8" — Fiction/memoir',           widthInches: 5.25,  heightInches: 8     },
  { id: "5.5x8",     name: '5.5" × 8" — Fiction variant',           widthInches: 5.5,   heightInches: 8     },
  { id: "5.5x8.5",   name: '5.5" × 8.5" — Most popular nonfiction', widthInches: 5.5,   heightInches: 8.5   },
  { id: "6x9",       name: '6" × 9" — Standard nonfiction',         widthInches: 6,     heightInches: 9     },
  { id: "6.14x9.21", name: '6.14" × 9.21" — Trade paperback',       widthInches: 6.14,  heightInches: 9.21  },
  { id: "6.69x9.61", name: '6.69" × 9.61" — Large trade',           widthInches: 6.69,  heightInches: 9.61  },
  { id: "7x10",      name: '7" × 10" — Textbooks/workbooks',        widthInches: 7,     heightInches: 10    },
  { id: "7.44x9.69", name: '7.44" × 9.69" — Crown quarto',          widthInches: 7.44,  heightInches: 9.69  },
  { id: "7.5x9.25",  name: '7.5" × 9.25" — Large nonfiction',       widthInches: 7.5,   heightInches: 9.25  },
  { id: "8x10",      name: '8" × 10" — Large format nonfiction',    widthInches: 8,     heightInches: 10    },
  { id: "8.25x6",    name: '8.25" × 6" — Landscape',                widthInches: 8.25,  heightInches: 6     },
  { id: "8.25x8.25", name: '8.25" × 8.25" — Square',                widthInches: 8.25,  heightInches: 8.25  },
  { id: "8.5x8.5",   name: '8.5" × 8.5" — Large square',            widthInches: 8.5,   heightInches: 8.5   },
  { id: "8.5x11",    name: '8.5" × 11" — Workbooks/journals',        widthInches: 8.5,   heightInches: 11    },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// HARDCOVER TRIM SIZES (KDP case-laminate hardcover supported sizes)
// ─────────────────────────────────────────────────────────────────────────────

export const HARDCOVER_TRIM_SIZES = [
  { id: "hc-5.5x8.5",   name: '5.5" × 8.5" — Standard hardcover',    widthInches: 5.5,   heightInches: 8.5   },
  { id: "hc-6x9",       name: '6" × 9" — Trade hardcover',             widthInches: 6,     heightInches: 9     },
  { id: "hc-6.14x9.21", name: '6.14" × 9.21" — Trade paperback size', widthInches: 6.14,  heightInches: 9.21  },
  { id: "hc-6.69x9.61", name: '6.69" × 9.61" — Large trade hardcover', widthInches: 6.69,  heightInches: 9.61  },
  { id: "hc-7x10",      name: '7" × 10" — Large hardcover',            widthInches: 7,     heightInches: 10    },
  { id: "hc-7.44x9.69", name: '7.44" × 9.69" — Crown quarto hardcover', widthInches: 7.44, heightInches: 9.69  },
  { id: "hc-7.5x9.25",  name: '7.5" × 9.25" — Large nonfiction HC',   widthInches: 7.5,   heightInches: 9.25  },
  { id: "hc-8.5x11",    name: '8.5" × 11" — Large format hardcover',   widthInches: 8.5,   heightInches: 11    },
] as const;

export type HardcoverTrimSizeId = (typeof HARDCOVER_TRIM_SIZES)[number]["id"];

export type TrimSizeId = (typeof TRIM_SIZES)[number]["id"];

export const BOOK_TYPES = [
  { id: "nonfiction", name: "Standard Nonfiction" },
  { id: "fiction", name: "Fiction / Novel" },
  { id: "memoir", name: "Memoir / Biography" },
  { id: "selfhelp", name: "Self-Help / Business" },
  { id: "childrens", name: "Children's Book (picture book)" },
  { id: "coffeetable", name: "Coffee Table / Photo Book" },
  { id: "coloring", name: "Coloring Book" },
  { id: "puzzle", name: "Puzzle Book / Activity Book" },
  { id: "workbook", name: "Workbook / Journal" },
] as const;

export type BookTypeId = (typeof BOOK_TYPES)[number]["id"];

/** Classic book fonts for body text */
export const BODY_FONTS = [
  { id: "ebgaramond", name: "EB Garamond — Elegant, traditional (RECOMMENDED)" },
  { id: "palatino", name: "Palatino Linotype — Warm, readable" },
  { id: "georgia", name: "Georgia — Clean, universal" },
  { id: "times", name: "Times New Roman — Professional, academic" },
  { id: "cambria", name: "Cambria — Modern serif, KDP approved" },
  { id: "bookantiqua", name: "Book Antiqua — Classic fiction feel" },
  { id: "librebaskerville", name: "Libre Baskerville — High contrast, refined" },
] as const;

export type BodyFontId = (typeof BODY_FONTS)[number]["id"];

/** Display/heading fonts for chapter titles */
export const HEADING_FONTS = [
  { id: "bebas", name: "Bebas Neue — Bold, condensed, modern" },
  { id: "oswald", name: "Oswald — Strong, authoritative" },
  { id: "montserrat", name: "Montserrat Bold — Geometric, contemporary" },
  { id: "playfair", name: "Playfair Display — Elegant, editorial" },
  { id: "raleway", name: "Raleway — Minimalist, premium" },
  { id: "abril", name: "Abril Fatface — Dramatic, high contrast" },
  { id: "cinzel", name: "Cinzel — Classical, sophisticated" },
] as const;

export type HeadingFontId = (typeof HEADING_FONTS)[number]["id"];

export const FONT_SIZES = [
  { id: 10, name: "10pt — Compact (more pages)" },
  { id: 11, name: "11pt — Standard (RECOMMENDED)" },
  { id: 12, name: "12pt — Larger print" },
] as const;

export type FontSizeId = (typeof FONT_SIZES)[number]["id"];

export const PARAGRAPH_STYLES = [
  { id: "fiction", name: "Fiction — First line indent, no space between paragraphs" },
  { id: "nonfiction", name: "Nonfiction Block — No indent, 10pt space between paragraphs" },
] as const;

export type ParagraphStyleId = (typeof PARAGRAPH_STYLES)[number]["id"];

export const LINE_SPACING_OPTIONS = [
  { id: 1.15, name: "1.15x — Print book (RECOMMENDED)" },
  { id: 1.2, name: "1.2x — Compact" },
  { id: 1.3, name: "1.3x — Standard" },
  { id: 1.5, name: "1.5x — Airy/relaxed" },
] as const;

export type LineSpacingId = (typeof LINE_SPACING_OPTIONS)[number]["id"];

export const BLEED_POINTS = 9; // 0.125" = 9pt

/**
 * Gutter (inside margin) in inches by page count.
 * Matches KDP's exact published table — including the 701+ bracket at 0.875".
 */
export function getGutterInches(pageCount: number): number {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.500;
  if (pageCount <= 500) return 0.625;
  if (pageCount <= 700) return 0.750;
  return 0.875; // 701–828 pages
}

export function inchesToPoints(inches: number): number {
  return inches * 72;
}

const TRIM_SIZE_IDS = TRIM_SIZES.map((t) => t.id);

/** Return a valid TrimSizeId; use "6x9" if invalid (so generation never throws). */
export function validateTrimSize(id: unknown): TrimSizeId {
  return typeof id === "string" && (TRIM_SIZE_IDS as readonly string[]).includes(id) ? (id as TrimSizeId) : "6x9";
}

export function getTrimSize(id: TrimSizeId) {
  return TRIM_SIZES.find((t) => t.id === id);
}

/** Full form config submitted to the API */
export interface KdpFormatConfig {
  bookTitle: string;
  authorName: string;
  copyrightYear: number;
  isbn: string;
  trimSize: TrimSizeId;
  bookType: BookTypeId;
  bodyFont: BodyFontId;
  headingFont: HeadingFontId;
  fontSize: FontSizeId;
  paragraphStyle: ParagraphStyleId;
  lineSpacing: LineSpacingId;
  interiorColor: "bw" | "color";
  paperColor: "white" | "cream";
  bleedImages: boolean;
  /** When true, only Word Heading 1/2/3 create chapters; no paragraph promotion. Use for already-formatted KDP-ready DOCX. */
  alreadyFormatted?: boolean;
  frontMatter: {
    titlePage: boolean;
    copyrightPage: boolean;
    toc: boolean;
    dedication: boolean;
    dedicationText?: string;
  };
}

export const DEFAULT_CONFIG: KdpFormatConfig = {
  bookTitle: "",
  authorName: "",
  copyrightYear: new Date().getFullYear(),
  isbn: "",
  trimSize: "6x9",
  bookType: "nonfiction",
  bodyFont: "ebgaramond",
  headingFont: "playfair",
  fontSize: 11,
  paragraphStyle: "nonfiction",
  lineSpacing: 1.15,
  interiorColor: "bw",
  paperColor: "white",
  bleedImages: false,
  alreadyFormatted: false,
  frontMatter: {
    titlePage: true,
    copyrightPage: true,
    toc: true,
    dedication: false,
    dedicationText: "",
  },
};
