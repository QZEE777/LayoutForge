/**
 * KDP DOCX parser: read word/document.xml via JSZip, extract structure and text.
 * Structure = Word Heading 1/2/3 and/or CHAPTER N / SECTION N (when not alreadyFormatted).
 * Content before first heading goes into a chapter with empty title (never rendered as body).
 */

import JSZip from "jszip";
import { runKdpCompliance } from "./kdpComplianceEngine";

export interface ParsedParagraph {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export interface ParsedImage {
  dataUri: string;
  contentType: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ParsedChapter {
  number: number;
  title: string;
  level: 1 | 2 | 3;
  paragraphs: ParsedParagraph[];
  images: ParsedImage[];
}

export interface ParsedFrontMatter {
  title: string;
  author: string;
  copyright: string;
  isbn: string;
}

export interface ParsedContent {
  frontMatter: ParsedFrontMatter;
  chapters: ParsedChapter[];
  estimatedPageCount: number;
  detectedIssues: string[];
}

export type ParseOptions = { alreadyFormatted?: boolean; title?: string; author?: string };

const KDP_MIN_PAGES = 24;
const KDP_MAX_PAGES = 828;

function sanitize(text: string): string {
  const noControl = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return noControl.replace(/^[\s\u200B-\u200D\uFEFF|]+|[\s\u200B-\u200D\uFEFF|]+$/g, "").trim();
}

function isWordHeading(style: string, n: 1 | 2 | 3): boolean {
  const s = (style || "").trim();
  if (!s) return false;
  return s === `Heading${n}` || s === `Heading ${n}` || new RegExp(`Heading\\s*${n}`, "i").test(s);
}

/**
 * Parse DOCX buffer into ParsedContent for KDP DOCX/PDF generation.
 */
export async function parseDocxForKdp(
  buffer: Buffer,
  options?: ParseOptions
): Promise<ParsedContent> {
  const alreadyFormatted = !!options?.alreadyFormatted;

  const zip = await JSZip.loadAsync(buffer);
  const xml = (await zip.file("word/document.xml")?.async("string")) || "";
  const pBlocks = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];

  const paragraphs: Array<{ text: string; style: string; bold: boolean; italic: boolean }> = [];

  for (const pXml of pBlocks) {
    const styleMatch = pXml.match(/<w:pStyle w:val="([^"]*)"/);
    const style = styleMatch?.[1] || "Normal";

    let text = "";
    let bold = false;
    let italic = false;
    const runs = pXml.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || [];
    for (const run of runs) {
      const rPr = run.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] || "";
      if (/<w:b\/>|<w:b\s+[^>]*w:val="1"/.test(rPr)) bold = true;
      if (/<w:i\/>|<w:i\s+[^>]*w:val="1"/.test(rPr)) italic = true;
      const tNodes = run.match(/<w:t[^>]*>[\s\S]*?<\/w:t>/g) || [];
      for (const t of tNodes) {
        text += t.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "");
      }
    }
    const cleaned = sanitize(text);
    if (!cleaned) continue;
    if (/^\d{1,3}$/.test(cleaned)) continue;
    paragraphs.push({ text: cleaned, style, bold, italic });
  }

  const chapters: ParsedChapter[] = [];
  let current: ParsedChapter = {
    number: 1,
    title: "",
    level: 1,
    paragraphs: [],
    images: [],
  };

  for (const p of paragraphs) {
    const h1 = isWordHeading(p.style, 1);
    const h2 = isWordHeading(p.style, 2);
    const h3 = isWordHeading(p.style, 3);
    const textH1 =
      !alreadyFormatted &&
      (/^CHAPTER\s+\d+/i.test(p.text) || /^SECTION\s+(I+|IV|V|\d+)/i.test(p.text));

    const asH1 = h1 || textH1;
    const asH2 = h2 && !asH1;
    const asH3 = h3 && !asH1 && !asH2;

    if (asH1) {
      chapters.push(current);
      current = {
        number: chapters.length + 1,
        title: p.text,
        level: 1,
        paragraphs: [],
        images: [],
      };
    } else if (asH2) {
      chapters.push(current);
      current = {
        number: chapters.length + 1,
        title: p.text,
        level: 2,
        paragraphs: [],
        images: [],
      };
    } else if (asH3) {
      chapters.push(current);
      current = {
        number: chapters.length + 1,
        title: p.text,
        level: 3,
        paragraphs: [],
        images: [],
      };
    } else {
      current.paragraphs.push({ text: p.text, bold: p.bold, italic: p.italic });
    }
  }
  chapters.push(current);

  const validChapters = chapters.filter((c) => c.title.trim() || c.paragraphs.length > 0);
  const totalParagraphs = validChapters.reduce((s, c) => s + c.paragraphs.length, 0);
  const estimatedPageCount = Math.max(KDP_MIN_PAGES, Math.ceil(totalParagraphs / 25));
  const hasPreChapterContent = validChapters.some((c) => !c.title.trim() && c.paragraphs.length > 0);

  const detectedIssues = runKdpCompliance({
    estimatedPageCount,
    chaptersCount: validChapters.length,
    hasPreChapterContent,
    totalParagraphs,
  });

  return {
    frontMatter: { title: "", author: "", copyright: "", isbn: "" },
    chapters: validChapters,
    estimatedPageCount,
    detectedIssues,
  };
}
