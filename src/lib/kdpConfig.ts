/**
 * KDP Formatter configuration: trim sizes, book types, fonts, and options.
 * Used by the config form and PDF generation.
 */

export const TRIM_SIZES = [
  { id: "5x8", name: '5" x 8" — Popular fiction', widthInches: 5, heightInches: 8 },
  { id: "5.25x8", name: '5.25" x 8" — Fiction/memoir', widthInches: 5.25, heightInches: 8 },
  { id: "5.5x8.5", name: '5.5" x 8.5" — Most popular nonfiction', widthInches: 5.5, heightInches: 8.5 },
  { id: "6x9", name: '6" x 9" — Standard nonfiction', widthInches: 6, heightInches: 9 },
  { id: "6.14x9.21", name: '6.14" x 9.21" — Trade paperback', widthInches: 6.14, heightInches: 9.21 },
  { id: "7x10", name: '7" x 10" — Textbooks/workbooks', widthInches: 7, heightInches: 10 },
  { id: "8x10", name: '8" x 10" — Large format nonfiction', widthInches: 8, heightInches: 10 },
  { id: "8.5x11", name: '8.5" x 11" — Workbooks/journals', widthInches: 8.5, heightInches: 11 },
] as const;

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

/** Gutter (inside margin) in inches by estimated page count */
export function getGutterInches(pageCount: number): number {
  if (pageCount < 151) return 0.375;
  if (pageCount < 301) return 0.5;
  if (pageCount < 501) return 0.625;
  return 0.75;
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
