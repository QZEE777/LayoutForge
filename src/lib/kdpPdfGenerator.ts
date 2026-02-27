/**
 * KDP PDF generation using pdf-lib: front matter, chapters, running headers, images.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFFont,
  PDFPage,
  PDFImage,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { ParsedContent, ParsedChapter, ParsedParagraph, ParsedImage } from "./kdpDocxParser";
import type { KdpFormatConfig } from "./kdpConfig";
import {
  getTrimSize,
  getGutterInches,
  inchesToPoints,
  BLEED_POINTS,
  type TrimSizeId,
} from "./kdpConfig";

const PT_PER_INCH = 72;
const TOP_MARGIN = 0.75 * PT_PER_INCH;
const BOTTOM_MARGIN = 0.75 * PT_PER_INCH;
const OUTSIDE_MARGIN = 0.75 * PT_PER_INCH;
const HEADER_Y_OFFSET = 0.4 * PT_PER_INCH;

export interface KdpPdfResult {
  pdfBytes: Uint8Array;
  pageCount: number;
}

function getTextWidth(font: PDFFont, size: number, text: string): number {
  return font.widthOfTextAtSize(text, size);
}

/** Wrap text into lines that fit within maxWidth. */
function wrapLines(
  font: PDFFont,
  fontSize: number,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = current + " " + words[i];
    if (getTextWidth(font, fontSize, next) <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Draw a paragraph with optional first-line indent; returns final y. */
function drawParagraph(
  page: PDFPage,
  font: PDFFont,
  fontSize: number,
  lineHeight: number,
  text: string,
  x: number,
  y: number,
  textWidth: number,
  indentFirst: boolean,
  firstLineIndent: number,
  color: ReturnType<typeof rgb>
): number {
  const lines = wrapLines(font, fontSize, text, textWidth);
  let currentY = y;
  for (let i = 0; i < lines.length; i++) {
    const indent = indentFirst && i === 0 ? firstLineIndent : 0;
    page.drawText(lines[i], {
      x: x + indent,
      y: currentY,
      size: fontSize,
      font,
      color,
    });
    currentY -= lineHeight * fontSize;
  }
  return currentY;
}

export async function generateKdpPdf(
  content: ParsedContent,
  config: KdpFormatConfig
): Promise<KdpPdfResult> {
  const trim = getTrimSize(config.trimSize);
  if (!trim) throw new Error(`Unknown trim size: ${config.trimSize}`);

  const withBleed = config.bleedImages;
  const pageWidth = inchesToPoints(trim.widthInches) + (withBleed ? BLEED_POINTS * 2 : 0);
  const pageHeight = inchesToPoints(trim.heightInches) + (withBleed ? BLEED_POINTS * 2 : 0);

  const estimatedPages = content.estimatedPageCount;
  const gutterInches = getGutterInches(estimatedPages);
  const gutterPt = inchesToPoints(gutterInches);
  const insideMargin = gutterPt;
  const textWidth = pageWidth - insideMargin - OUTSIDE_MARGIN;
  const bodyTop = pageHeight - TOP_MARGIN;
  const bodyBottom = BOTTOM_MARGIN;
  const lineHeightMult = config.lineSpacing;
  const fontSize = config.fontSize;
  const firstLineIndent = config.paragraphStyle === "fiction" ? inchesToPoints(0.25) : 0;
  const paragraphSpacing = config.paragraphStyle === "nonfiction" ? 10 : 0;

  const pdfDoc = await PDFDocument.create();
  try {
    pdfDoc.registerFontkit(fontkit);
  } catch {
    // Continue without fontkit; use standard fonts only
  }

  const bodyFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bodyFontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const bodyFontItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const bodyFontBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const headingFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const black = rgb(0, 0, 0);
  const darkGray = rgb(0.2, 0.2, 0.2);

  const title = config.bookTitle || content.frontMatter.title || "Untitled";
  const author = config.authorName || content.frontMatter.author || "Unknown Author";
  const copyrightYear = config.copyrightYear;
  const isbn = config.isbn || content.frontMatter.isbn || "";

  let pageIndex = 0;
  const addPage = (): PDFPage => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    pageIndex++;
    return page;
  };

  // ----- Front matter -----
  if (config.frontMatter.titlePage) {
    const halfTitle = addPage();
    const halfTitleY = pageHeight / 2 + 24;
    const halfTitleLines = wrapLines(headingFont, 28, title, textWidth);
    let ty = halfTitleY;
    for (const line of halfTitleLines) {
      const w = getTextWidth(headingFont, 28, line);
      halfTitle.drawText(line, {
        x: (pageWidth - w) / 2,
        y: ty,
        size: 28,
        font: headingFont,
        color: black,
      });
      ty -= 34;
    }
  }

  if (config.frontMatter.titlePage) {
    const titlePage = addPage();
    let ty = pageHeight * 0.65;
    const titleLines = wrapLines(headingFont, 28, title, textWidth);
    for (const line of titleLines) {
      const w = getTextWidth(headingFont, 28, line);
      titlePage.drawText(line, {
        x: (pageWidth - w) / 2,
        y: ty,
        size: 28,
        font: headingFont,
        color: black,
      });
      ty -= 34;
    }
    ty -= 24;
    const authorLines = wrapLines(bodyFont, 14, author, textWidth);
    for (const line of authorLines) {
      const w = getTextWidth(bodyFont, 14, line);
      titlePage.drawText(line, {
        x: (pageWidth - w) / 2,
        y: ty,
        size: 14,
        font: bodyFont,
        color: black,
      });
      ty -= 18;
    }
  }

  if (config.frontMatter.copyrightPage) {
    const copyrightPage = addPage();
    const copyY = pageHeight * 0.55;
    const copyFontSize = 9;
    const lines = [
      `Copyright © ${copyrightYear} ${author}. All rights reserved.`,
      isbn ? `ISBN: ${isbn}` : null,
      "Printed in the United States of America.",
      "First Edition",
    ].filter(Boolean) as string[];
    let cy = copyY;
    for (const line of lines) {
      copyrightPage.drawText(line, {
        x: insideMargin,
        y: cy,
        size: copyFontSize,
        font: bodyFont,
        color: darkGray,
      });
      cy -= copyFontSize * 1.5;
    }
  }

  if (config.frontMatter.toc && content.chapters.length > 0) {
    const tocPage = addPage();
    tocPage.drawText("Contents", {
      x: insideMargin,
      y: bodyTop - 24,
      size: 18,
      font: headingFont,
      color: black,
    });
    let tocY = bodyTop - 48;
    for (const ch of content.chapters) {
      const tocLine = `${ch.title} ............................ ${ch.number}`;
      const lineW = getTextWidth(bodyFont, 11, tocLine);
      if (tocY < bodyBottom + 20) {
        // Would need another TOC page; keep it simple
        break;
      }
      tocPage.drawText(tocLine, {
        x: insideMargin,
        y: tocY,
        size: 11,
        font: bodyFont,
        color: black,
      });
      tocY -= 14;
    }
  }

  if (config.frontMatter.dedication && config.frontMatter.dedicationText) {
    const dedPage = addPage();
    const dedLines = wrapLines(bodyFontItalic, 12, config.frontMatter.dedicationText, textWidth);
    let dy = pageHeight / 2 + (dedLines.length * 14) / 2;
    for (const line of dedLines) {
      const w = getTextWidth(bodyFontItalic, 12, line);
      dedPage.drawText(line, {
        x: (pageWidth - w) / 2,
        y: dy,
        size: 12,
        font: bodyFontItalic,
        color: darkGray,
      });
      dy -= 16;
    }
  }

  // ----- Chapter and body pages -----
  let currentPage: PDFPage | null = null;
  let currentY = 0;
  let arabicPageNum = 0;

  const ensurePage = (): PDFPage => {
    if (!currentPage || currentY < bodyBottom + fontSize * 2) {
      currentPage = addPage();
      currentY = bodyTop;
      arabicPageNum++;
      const isEven = (pdfDoc.getPageCount() - 1) % 2 === 1;
      const headerText = isEven ? author : title;
      const headerW = getTextWidth(bodyFontItalic, 9, headerText);
      currentPage.drawText(headerText, {
        x: (pageWidth - headerW) / 2,
        y: pageHeight - HEADER_Y_OFFSET,
        size: 9,
        font: bodyFontItalic,
        color: darkGray,
      });
      currentPage.drawLine({
        start: { x: insideMargin, y: pageHeight - HEADER_Y_OFFSET - 6 },
        end: { x: pageWidth - OUTSIDE_MARGIN, y: pageHeight - HEADER_Y_OFFSET - 6 },
        thickness: 0.5,
        color: darkGray,
      });
    }
    return currentPage;
  };

  const drawBodyParagraph = (p: ParsedParagraph): void => {
    const page = ensurePage();
    const font = p.bold && p.italic ? bodyFontBoldItalic : p.bold ? bodyFontBold : p.italic ? bodyFontItalic : bodyFont;
    const lineHeight = lineHeightMult;
    const x = insideMargin;
    const lines = wrapLines(font, fontSize, p.text, textWidth);
    for (const line of lines) {
      if (currentY < bodyBottom + fontSize) {
        ensurePage();
        if (currentPage) currentY = bodyTop;
      }
      if (!currentPage) break;
      const indent = currentY === bodyTop ? 0 : firstLineIndent;
      currentPage.drawText(line, {
        x: x + indent,
        y: currentY,
        size: fontSize,
        font,
        color: black,
      });
      currentY -= lineHeight * fontSize;
    }
    currentY -= paragraphSpacing;
  };

  for (const chapter of content.chapters) {
    const page = addPage();
    currentPage = page;
    const chapterDropY = pageHeight * (2 / 3);
    const chapterLabel = `Chapter ${chapter.number}`;
    const chapterLabelW = getTextWidth(headingFont, 12, chapterLabel);
    page.drawText(chapterLabel, {
      x: (pageWidth - chapterLabelW) / 2,
      y: chapterDropY,
      size: 12,
      font: headingFont,
      color: black,
    });
    const titleLines = wrapLines(headingFont, 22, chapter.title, textWidth);
    let titleY = chapterDropY - 24;
    for (const line of titleLines) {
      const w = getTextWidth(headingFont, 22, line);
      page.drawText(line, {
        x: (pageWidth - w) / 2,
        y: titleY,
        size: 22,
        font: headingFont,
        color: black,
      });
      titleY -= 26;
    }
    currentY = titleY - 48;

    for (const p of chapter.paragraphs) {
      drawBodyParagraph(p);
    }

    for (const img of chapter.images) {
      try {
        const base64 = img.dataUri.replace(/^data:[^;]+;base64,/, "");
        const imgBytes = Uint8Array.from(Buffer.from(base64, "base64"));
        const image = /png/i.test(img.contentType)
          ? await pdfDoc.embedPng(imgBytes)
          : await pdfDoc.embedJpg(imgBytes);
        const { width: iw, height: ih } = image.scale(1);
        const maxW = textWidth;
        const maxH = (bodyTop - bodyBottom) * 0.6;
        let scale = Math.min(maxW / iw, maxH / ih, 1);
        const drawW = iw * scale;
        const drawH = ih * scale;
        const page = ensurePage();
        if (currentY - drawH < bodyBottom) {
          ensurePage();
          if (currentPage) currentY = bodyTop;
        }
        if (currentPage) {
          const imgX = insideMargin + (textWidth - drawW) / 2;
          currentPage.drawImage(image, {
            x: imgX,
            y: currentY - drawH,
            width: drawW,
            height: drawH,
          });
          currentY -= drawH + 12;
        }
      } catch {
        // Skip image on embed error
      }
    }
  }

  // Add page numbers starting at 1 on first chapter page (skip front matter)
  const pages = pdfDoc.getPages();
  let frontMatterPages = 0;
  if (config.frontMatter.titlePage) frontMatterPages += 2; // half title + title
  if (config.frontMatter.copyrightPage) frontMatterPages += 1;
  if (config.frontMatter.toc && content.chapters.length > 0) frontMatterPages += 1;
  if (config.frontMatter.dedication && config.frontMatter.dedicationText) frontMatterPages += 1;
  let num = 1;
  for (let i = frontMatterPages; i < pages.length; i++) {
    const p = pages[i];
    const pageNum = num++;
    p.drawText(String(pageNum), {
      x: (pageWidth - getTextWidth(bodyFont, 10, String(pageNum))) / 2,
      y: BOTTOM_MARGIN - 14,
      size: 10,
      font: bodyFont,
      color: darkGray,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, pageCount: pdfDoc.getPageCount() };
}
