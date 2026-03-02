/**
 * DOCX parsing for KDP formatter: direct OOXML parsing via JSZip (no mammoth).
 * Preserves all paragraphs from word/document.xml.
 */

import JSZip from "jszip";

export interface ParsedParagraph {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** When alreadyFormatted: raw <w:pPr>...</w:pPr> XML from source DOCX for pass-through. */
  rawPprXml?: string;
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
  dedication?: string;
}

export interface ParsedContent {
  frontMatter: ParsedFrontMatter;
  chapters: ParsedChapter[];
  estimatedPageCount: number;
  detectedIssues: string[];
}

/** Options for parsing. When alreadyFormatted is true, only Word Heading 1/2/3 styles define structure. */
export type ParseOptions = { alreadyFormatted?: boolean };

function isHeadingStyle(style: string, n: 1 | 2 | 3): boolean {
  const s = style || "";
  return s === `Heading${n}` || s === `Heading ${n}` || new RegExp(`Heading\\s*${n}`, "i").test(s);
}

/**
 * Parse DOCX buffer into structured content for KDP generation.
 * Uses JSZip to read word/document.xml and regex to extract paragraphs in order.
 */
export async function parseDocxForKdp(
  buffer: Buffer,
  options?: { title?: string; author?: string; alreadyFormatted?: boolean }
): Promise<ParsedContent> {
  const issues: string[] = [];
  const alreadyFormatted = !!options?.alreadyFormatted;

  const zip = await JSZip.loadAsync(buffer);
  const xmlContent = (await zip.file("word/document.xml")?.async("string")) || "";

  const paragraphMatches = xmlContent.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];

  const allParagraphs = paragraphMatches.map((pXml) => {
    const styleMatch = pXml.match(/<w:pStyle w:val="([^"]+)"/);
    const style = styleMatch?.[1] || "Normal";

    const alignMatch = pXml.match(/<w:jc w:val="([^"]+)"/);
    const _align = alignMatch?.[1] || "";

    const rawPprXml =
      alreadyFormatted && pXml.includes("<w:pPr")
        ? (pXml.match(/<w:pPr[\s\S]*?<\/w:pPr>/)?.[0] ?? "")
        : undefined;

    const runs = pXml.match(/<w:r[ >][\s\S]*?<\/w:r>/g) || [];
    let text = "";
    let bold = false;
    let italic = false;

    for (const run of runs) {
      const rPr = run.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/)?.[1] || "";
      const runBold = /<w:b\/>|<w:b\s+[^>]*w:val="1"/.test(rPr);
      const runItalic = /<w:i\/>|<w:i\s+[^>]*w:val="1"/.test(rPr);
      const textTags = run.match(/<w:t[^>]*>[\s\S]*?<\/w:t>/g) || [];
      const runText = textTags
        .map((t) => t.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, ""))
        .join("");
      text += runText;
      if (runBold) bold = true;
      if (runItalic) italic = true;
    }

    return { text: text.trim(), style, bold, italic, rawPprXml };
  });

  const filtered = allParagraphs.filter((p) => {
    if (!p.text) return false;
    if (/^\d{1,3}$/.test(p.text)) return false;
    return true;
  });

  const chapters: ParsedChapter[] = [];
  let currentChapter: ParsedChapter = {
    number: 1,
    title: "Front Matter",
    level: 1,
    paragraphs: [],
    images: [],
  };

  for (const p of filtered) {
    const styleH1 = isHeadingStyle(p.style, 1);
    const styleH2 = isHeadingStyle(p.style, 2);
    const styleH3 = isHeadingStyle(p.style, 3);
    const textH1 = !alreadyFormatted && (/^CHAPTER\s+\d+/i.test(p.text) || /^SECTION\s+(I+|IV|V|\d+)/i.test(p.text));

    const isH1 = styleH1 || textH1;
    const isH2 = styleH2 && !isH1;
    const isH3 = styleH3 && !isH1 && !isH2;

    if (isH1) {
      chapters.push(currentChapter);
      currentChapter = {
        number: chapters.length + 1,
        title: p.text,
        level: 1,
        paragraphs: [],
        images: [],
      };
    } else if (isH2) {
      chapters.push(currentChapter);
      currentChapter = {
        number: chapters.length + 1,
        title: p.text,
        level: 2,
        paragraphs: [],
        images: [],
      };
    } else if (isH3) {
      chapters.push(currentChapter);
      currentChapter = {
        number: chapters.length + 1,
        title: p.text,
        level: 3,
        paragraphs: [],
        images: [],
      };
    } else {
      currentChapter.paragraphs.push({
        text: p.text,
        bold: p.bold,
        italic: p.italic,
        ...(p.rawPprXml !== undefined && { rawPprXml: p.rawPprXml }),
      });
    }
  }
  chapters.push(currentChapter);

  const validChapters = chapters.filter((c) => c.title || c.paragraphs.length > 0);

  const totalParagraphs = validChapters.reduce((sum, ch) => sum + ch.paragraphs.length, 0);
  const estimatedPageCount = Math.max(24, Math.ceil(totalParagraphs / 25));

  if (estimatedPageCount < 24) issues.push("Document is under 24 pages; KDP requires a minimum page count.");
  if (estimatedPageCount > 828) issues.push("Document exceeds 828 pages; KDP maximum for most trim sizes.");

  console.log(
    "[kdpDocxParser] Input paragraphs:",
    allParagraphs.length,
    "After filter:",
    filtered.length,
    "Chapters:",
    validChapters.length,
    "Body paragraphs:",
    totalParagraphs
  );

  return {
    frontMatter: { title: "", author: "", copyright: "", isbn: "" },
    chapters: validChapters,
    estimatedPageCount,
    detectedIssues: issues,
  };
}
