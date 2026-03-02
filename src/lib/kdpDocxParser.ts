/**
 * DOCX parsing for KDP formatter: mammoth → structured content with cleaning and chapter detection.
 */

import mammoth from "mammoth";

export interface ParsedParagraph {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ParsedImage {
  dataUri: string;
  contentType: string;
  alt?: string;
  /** Approx width/height from data if needed */
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
  dedication?: string;
}

export interface ParsedContent {
  frontMatter: ParsedFrontMatter;
  chapters: ParsedChapter[];
  estimatedPageCount: number;
  detectedIssues: string[];
}

/** Only detect chapter/section headings by exact patterns. Returns level 1 or null.
 * CHAPTER: exactly "CHAPTER X" or "CHAPTER X — subtitle" at start.
 * SECTION: "SECTION N" or "SECTION I" (roman/number) at start. */
function detectHeadingLevel(text: string, _isBold: boolean): 1 | null {
  const t = text.trim();
  if (!t) return null;

  // CHAPTER: only "CHAPTER X" or "CHAPTER X — subtitle"
  if (/^CHAPTER\s+\d+\s*([—\-–]\s*.+)?$/i.test(t)) return 1;

  // SECTION: SECTION followed by roman numerals or digits
  if (/^SECTION\s+(I+|IV|V|[0-9]+)/i.test(t)) return 1;

  return null;
}

function cleanText(text: string): string {
  let s = text
    .replace(/\s+/g, " ")
    .replace(/\t/g, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s*\.\s{2,}/g, ". ")
    .replace(/--/g, "\u2014")
    .replace(/\.\.\./g, "\u2026")
    .replace(/"/g, "\u201c")
    .replace(/"/g, "\u201d")
    .replace(/'/g, "\u2018")
    .replace(/'/g, "\u2019")
    .trim();
  while (s.includes("  ")) s = s.replace(/  /g, " ");
  return s;
}

/** Extract base64 and content type from data URI */
function parseDataUri(dataUri: string): { contentType: string; base64: string } | null {
  const m = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { contentType: m[1], base64: m[2] };
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractAttr(html: string, attr: string): string | null {
  const re = new RegExp(attr + '\\s*=\\s*["\']([^"\']*)["\']', "i");
  const m = html.match(re);
  return m ? m[1] : null;
}

/** Options for parsing. When alreadyFormatted is true, only h1/h2/h3 from the document create chapters; paragraphs are never promoted to headings. */
export type ParseOptions = { alreadyFormatted?: boolean };

/** Convert HTML from mammoth into structured chapters and paragraphs (Node-safe, no DOM). */
function htmlToStructure(html: string, issues: string[], options?: ParseOptions): { chapters: ParsedChapter[]; frontMatter: ParsedFrontMatter } {
  const alreadyFormatted = !!options?.alreadyFormatted;
  const chapters: ParsedChapter[] = [];
  let currentChapter: ParsedChapter = {
    number: 0,
    title: "Body",
    level: 1,
    paragraphs: [],
    images: [],
  };
  let chapterNumber = 0;
  const frontMatter: ParsedFrontMatter = { title: "", author: "", copyright: "", isbn: "" };

  const flushChapter = () => {
    if (currentChapter.paragraphs.length > 0 || currentChapter.images.length > 0 || currentChapter.number > 0) {
      if (currentChapter.number === 0 && chapterNumber === 0 && currentChapter.paragraphs.length > 0) {
        chapterNumber = 1;
        currentChapter.number = 1;
        currentChapter.title = "Chapter 1";
      }
      chapters.push({ ...currentChapter });
    }
  };

  // Match <h1>...</h1>, <h2>...</h2>, <h3>...</h3>, <p>...</p>, and <img ... />
  const blockRe = /<(h[123]|p)[^>]*>([\s\S]*?)<\/\1>|<img([^>]*?)\/?>/gi;
  const segments: { type: string; raw: string }[] = [];
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRe.exec(html)) !== null) {
    if (blockMatch[1]) {
      segments.push({ type: blockMatch[1].toLowerCase(), raw: blockMatch[2] });
    } else {
      segments.push({ type: "img", raw: blockMatch[3] || "" });
    }
  }

  for (const seg of segments) {
    if (seg.type === "h1") {
      flushChapter();
      chapterNumber++;
      currentChapter = {
        number: chapterNumber,
        title: cleanText(stripTags(seg.raw)) || `Chapter ${chapterNumber}`,
        level: 1,
        paragraphs: [],
        images: [],
      };
    } else if (seg.type === "h2") {
      flushChapter();
      chapterNumber++;
      currentChapter = {
        number: chapterNumber,
        title: cleanText(stripTags(seg.raw)) || `Section ${chapterNumber}`,
        level: 2,
        paragraphs: [],
        images: [],
      };
    } else if (seg.type === "h3") {
      flushChapter();
      chapterNumber++;
      currentChapter = {
        number: chapterNumber,
        title: cleanText(stripTags(seg.raw)) || `Subsection ${chapterNumber}`,
        level: 3,
        paragraphs: [],
        images: [],
      };
    } else if (seg.type === "p") {
      const text = cleanText(stripTags(seg.raw));
      const trimmed = text.trim();
      if (!trimmed) continue;
      if (/^\d{1,3}$/.test(trimmed)) continue;
      const bold = /<strong|<\/strong>|<b>|<\/b>/i.test(seg.raw);
      const italic = /<em|<\/em>|<i>|<\/i>/i.test(seg.raw);
      const underline = /<u>|<\/u>/i.test(seg.raw);

      // When alreadyFormatted, never promote a paragraph to a heading — only Word Heading 1/2/3 (h1/h2/h3) define structure.
      const headingLevel = alreadyFormatted ? null : detectHeadingLevel(text, bold);
      if (headingLevel !== null) {
        console.log("[kdpDocxParser] Detected heading:", { level: headingLevel, title: text.slice(0, 60) });
        flushChapter();
        chapterNumber++;
        currentChapter = {
          number: chapterNumber,
          title: text,
          level: headingLevel,
          paragraphs: [],
          images: [],
        };
      } else {
        currentChapter.paragraphs.push({ text, bold, italic, underline });
      }
    } else if (seg.type === "img") {
      const src = extractAttr(seg.raw, "src");
      const alt = extractAttr(seg.raw, "alt");
      if (src && src.startsWith("data:")) {
        const parsed = parseDataUri(src);
        if (parsed)
          currentChapter.images.push({
            dataUri: src,
            contentType: parsed.contentType,
            alt: alt || undefined,
          });
      }
    }
  }
  flushChapter();

  if (chapterNumber === 0 && chapters.length > 0) {
    issues.push("No chapter headings detected; entire document treated as one chapter.");
    chapters[chapters.length - 1].number = 1;
    chapters[chapters.length - 1].title = "Chapter 1";
  } else if (chapterNumber === 0 && chapters.length === 0 && currentChapter.paragraphs.length > 0) {
    issues.push("No chapter headings detected; entire document treated as one chapter.");
    currentChapter.number = 1;
    currentChapter.title = "Chapter 1";
    chapters.push({ ...currentChapter });
  }

  return { chapters, frontMatter };
}

/**
 * Very conservative merge: only merge if current paragraph is under 30 characters AND has no end punctuation.
 * Everything else is kept separate to avoid losing content.
 */
function mergeSplitParagraphs(chapters: ParsedChapter[]): void {
  const maxShort = 30;
  const endPunct = /[.!?;]\s*$/;
  for (const ch of chapters) {
    const paras = ch.paragraphs;
    if (paras.length === 0) continue;
    const merged: ParsedParagraph[] = [];
    let i = 0;
    while (i < paras.length) {
      let p = paras[i];
      while (i + 1 < paras.length) {
        const trimmed = p.text.trim();
        const under30 = trimmed.length < maxShort;
        const noEndPunct = !endPunct.test(trimmed);
        if (!under30 || !noEndPunct) break;
        const next = paras[i + 1];
        p = {
          text: p.text.trimEnd() + " " + next.text.trimStart(),
          bold: p.bold,
          italic: p.italic,
          underline: p.underline,
        };
        i += 1;
      }
      merged.push(p);
      i += 1;
    }
    ch.paragraphs = merged;
  }
}

/** Estimate page count from word count (approx 300 words per page for 6x9) */
function estimatePageCount(chapters: ParsedChapter[]): number {
  let words = 0;
  for (const ch of chapters) {
    for (const p of ch.paragraphs) {
      words += p.text.split(/\s+/).filter(Boolean).length;
    }
  }
  return Math.max(24, Math.ceil(words / 300));
}

/**
 * Parse DOCX buffer into structured content for PDF generation.
 */
export async function parseDocxForKdp(buffer: Buffer, options?: { title?: string; author?: string; alreadyFormatted?: boolean }): Promise<ParsedContent> {
  const issues: string[] = [];

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading 2'] => h2",
        "p[style-name='Heading 3'] => h3",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
      ],
      convertImage: mammoth.images.dataUri,
    }
  );

  let html = result.value || "";
  html = html.replace(/\s+style=["'][^"']*["']/gi, "");
  if (result.messages?.length) {
    for (const m of result.messages) {
      if (m.type === "warning") issues.push(m.message);
    }
  }

  const { chapters, frontMatter } = htmlToStructure(html, issues, { alreadyFormatted: options?.alreadyFormatted });
  const inputParagraphCount = chapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0);
  mergeSplitParagraphs(chapters);
  const outputParagraphCount = chapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0);
  console.log("[kdpDocxParser] Paragraphs: input (after structure) =", inputParagraphCount, ", output (after merge) =", outputParagraphCount);
  const estimatedPageCount = estimatePageCount(chapters);

  if (estimatedPageCount < 24) issues.push("Document is under 24 pages; KDP requires a minimum page count.");
  if (estimatedPageCount > 828) issues.push("Document exceeds 828 pages; KDP maximum for most trim sizes.");

  return {
    frontMatter: { ...frontMatter },
    chapters,
    estimatedPageCount,
    detectedIssues: issues,
  };
}
