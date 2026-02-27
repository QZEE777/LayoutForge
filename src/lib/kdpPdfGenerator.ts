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

/** Simulate body layout to get TOC page numbers (1-based body page for each heading). */
function simulateBodyToc(
  content: ParsedContent,
  bodyFont: PDFFont,
  headingFont: PDFFont,
  textWidth: number,
  bodyTop: number,
  bodyBottom: number,
  pageHeight: number,
  fontSize: number,
  lineHeightMult: number,
  paragraphSpacing: number
): { title: string; level: 1 | 2 | 3; pageNum: number }[] {
  const entries: { title: string; level: 1 | 2 | 3; pageNum: number }[] = [];
  let bodyPageNum = 0;
  let currentY = bodyTop;
  const lineHeightPt = lineHeightMult * fontSize;

  for (const chapter of content.chapters) {
    if (chapter.level === 1) {
      bodyPageNum++;
      entries.push({ title: chapter.title, level: 1, pageNum: bodyPageNum });
      const titleLines = wrapLines(headingFont, 20, chapter.title, textWidth);
      const dropH = 12 + 12 + titleLines.length * 24 + 36;
      currentY = pageHeight / 3 - dropH;
      for (const p of chapter.paragraphs) {
        const lines = wrapLines(bodyFont, fontSize, p.text, textWidth);
        currentY -= lines.length * lineHeightPt + paragraphSpacing;
        if (currentY < bodyBottom) {
          bodyPageNum++;
          currentY = bodyTop;
        }
      }
    } else if (chapter.level === 2) {
      const h2Lines = wrapLines(headingFont, 13, chapter.title, textWidth);
      const need = 24 + h2Lines.length * 16 + 12 + lineHeightPt;
      if (currentY - need < bodyBottom) {
        bodyPageNum++;
        currentY = bodyTop;
      }
      entries.push({ title: chapter.title, level: 2, pageNum: bodyPageNum });
      currentY -= 24 + h2Lines.length * 16 + 12;
      for (const p of chapter.paragraphs) {
        const lines = wrapLines(bodyFont, fontSize, p.text, textWidth);
        currentY -= lines.length * lineHeightPt + paragraphSpacing;
        if (currentY < bodyBottom) {
          bodyPageNum++;
          currentY = bodyTop;
        }
      }
    } else {
      const h3Lines = wrapLines(bodyFont, 12, chapter.title, textWidth);
      const need = 18 + h3Lines.length * 14 + 8 + lineHeightPt;
      if (currentY - need < bodyBottom) {
        bodyPageNum++;
        currentY = bodyTop;
      }
      entries.push({ title: chapter.title, level: 3, pageNum: bodyPageNum });
      currentY -= 18 + h3Lines.length * 14 + 8;
      for (const p of chapter.paragraphs) {
        const lines = wrapLines(bodyFont, fontSize, p.text, textWidth);
        currentY -= lines.length * lineHeightPt + paragraphSpacing;
        if (currentY < bodyBottom) {
          bodyPageNum++;
          currentY = bodyTop;
        }
      }
    }
  }
  return entries;
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

  // BUG 1: Use config exactly — no truncation; full title and author
  const title = typeof config.bookTitle === "string" ? config.bookTitle : (content.frontMatter.title ?? "Untitled");
  const author = typeof config.authorName === "string" ? config.authorName : (content.frontMatter.author ?? "Unknown Author");
  const copyrightYear = config.copyrightYear;
  const isbn = config.isbn || content.frontMatter.isbn || "";
  const subtitle = (config as { subtitle?: string }).subtitle?.trim();

  let pageIndex = 0;
  const addPage = (): PDFPage => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    pageIndex++;
    return page;
  };

  // ----- Front matter -----
  // Fix 3: Half title as FIRST page (title only, 40% from top, 24pt)
  if (config.frontMatter.titlePage) {
    const halfTitle = addPage();
    const halfTitleY = pageHeight * 0.4;
    const halfTitleLines = wrapLines(headingFont, 24, title, textWidth);
    let ty = halfTitleY;
    for (const line of halfTitleLines) {
      const w = getTextWidth(headingFont, 24, line);
      halfTitle.drawText(line, {
        x: (pageWidth - w) / 2,
        y: ty,
        size: 24,
        font: headingFont,
        color: black,
      });
      ty -= 28;
    }
    // Blank left-facing page (page 2)
    addPage();
  }

  // BUG 2: Full title page (page 3) — title top third; "By" 11pt 32pt below title; author 14pt 12pt below "By". No truncation: wrap or reduce font (min 18pt).
  if (config.frontMatter.titlePage) {
    const titlePage = addPage();
    let ty = pageHeight * 0.35;
    let titleSize = 28;
    let titleLines = wrapLines(headingFont, titleSize, title, textWidth);
    while (titleLines.length > 3 && titleSize > 18) {
      titleSize -= 2;
      titleLines = wrapLines(headingFont, titleSize, title, textWidth);
    }
    for (const line of titleLines) {
      const w = getTextWidth(headingFont, titleSize, line);
      titlePage.drawText(line, {
        x: (pageWidth - w) / 2,
        y: ty,
        size: titleSize,
        font: headingFont,
        color: black,
      });
      ty -= titleSize + 6;
    }
    ty -= 32;
    const byW = getTextWidth(bodyFont, 11, "By");
    titlePage.drawText("By", {
      x: (pageWidth - byW) / 2,
      y: ty,
      size: 11,
      font: bodyFont,
      color: black,
    });
    ty -= 12;
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

  // BUG 2: Copyright page (page 4) — lower half, start at 55%, centered, 9pt
  if (config.frontMatter.copyrightPage) {
    const copyrightPage = addPage();
    const copyFontSize = 9;
    const startY = pageHeight * 0.55;
    const lineHeight = copyFontSize * 1.8;
    const block: string[] = [
      `Copyright © ${copyrightYear} ${author}. All rights reserved.`,
      "",
      "Printed in the United States of America.",
      "First Edition.",
      ...(isbn ? ["", `ISBN: ${isbn}`] : []),
    ];
    let cy = startY;
    for (const line of block) {
      if (line === "") {
        cy -= lineHeight;
        continue;
      }
      const w = getTextWidth(bodyFont, copyFontSize, line);
      copyrightPage.drawText(line, {
        x: (pageWidth - w) / 2,
        y: cy,
        size: copyFontSize,
        font: bodyFont,
        color: darkGray,
      });
      cy -= lineHeight;
    }
  }

  // BUG 3: TOC two-pass — use simulated body page numbers; level 1 bold 11pt, level 2 regular 10pt indent 18pt; dot leaders; page numbers right-aligned
  let tocEntries: { title: string; level: 1 | 2 | 3; pageNum: number }[] = [];
  if (config.frontMatter.toc && content.chapters.length > 0) {
    tocEntries = simulateBodyToc(
      content,
      bodyFont,
      headingFont,
      textWidth,
      bodyTop,
      bodyBottom,
      pageHeight,
      fontSize,
      lineHeightMult,
      paragraphSpacing
    );
  }
  const tocEntriesL1L2 = tocEntries.filter((e) => e.level === 1 || e.level === 2);
  if (tocEntriesL1L2.length > 0) {
    const tocIndentL2 = 18;
    const tocRightX = pageWidth - OUTSIDE_MARGIN - 24;
    let tocPage: PDFPage | null = null;
    let tocY = 0;
    const tocStartY = bodyTop - 24;
    let tocFirstPage = true;
    const ensureTocPage = () => {
      if (!tocPage || tocY < bodyBottom + 24) {
        tocPage = addPage();
        tocY = tocStartY;
        if (tocPage && tocFirstPage) {
          tocPage.drawText("Contents", {
            x: insideMargin,
            y: tocY,
            size: 18,
            font: headingFont,
            color: black,
          });
          tocY -= 32;
          tocFirstPage = false;
        }
      }
    };
    for (const entry of tocEntriesL1L2) {
      ensureTocPage();
      if (!tocPage) break;
      const isLevel1 = entry.level === 1;
      const tocFontSize = isLevel1 ? 11 : 10;
      const font = isLevel1 ? bodyFontBold : bodyFont;
      const x = isLevel1 ? insideMargin : insideMargin + tocIndentL2;
      const titleShort = entry.title.length > 50 ? entry.title.slice(0, 47) + "..." : entry.title;
      const pageNumStr = String(entry.pageNum);
      const numW = getTextWidth(bodyFont, tocFontSize, pageNumStr);
      (tocPage as PDFPage).drawText(titleShort, {
        x,
        y: tocY,
        size: tocFontSize,
        font,
        color: black,
      });
      (tocPage as PDFPage).drawText(pageNumStr, {
        x: tocRightX - numW,
        y: tocY,
        size: tocFontSize,
        font,
        color: black,
      });
      const lineY = tocY + tocFontSize / 2;
      const titleW = getTextWidth(font, tocFontSize, titleShort);
      const dotStart = x + titleW + 8;
      const dotEnd = tocRightX - numW - 8;
      if (dotEnd > dotStart) {
        let dotX = dotStart;
        while (dotX < dotEnd) {
          (tocPage as PDFPage).drawText("\u00B7", {
            x: dotX,
            y: tocY,
            size: tocFontSize,
            font,
            color: darkGray,
          });
          dotX += getTextWidth(font, tocFontSize, "\u00B7") + 2;
        }
      }
      tocY -= isLevel1 ? 14 : 12;
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
  const sectionOpenerPageIndices = new Set<number>();

  const ensurePage = (drawHeader = true): PDFPage => {
    if (!currentPage || currentY < bodyBottom + fontSize * 2) {
      currentPage = addPage();
      currentY = bodyTop;
      arabicPageNum++;
      if (drawHeader) {
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
    }
    return currentPage;
  };

  let isFirstParagraphAfterHeading = true;

  const drawBodyParagraph = (p: ParsedParagraph, noIndent: boolean): void => {
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
      const useIndent = !noIndent && currentY !== bodyTop ? firstLineIndent : 0;
      currentPage.drawText(line, {
        x: x + useIndent,
        y: currentY,
        size: fontSize,
        font,
        color: black,
      });
      currentY -= lineHeight * fontSize;
    }
    currentY -= paragraphSpacing;
  };

  const lineHeightPt = lineHeightMult * fontSize;
  const threeLines = lineHeightPt * 3;

  const frontMatterPages = pdfDoc.getPageCount();

  for (const chapter of content.chapters) {
    if (chapter.level === 1) {
      // BUG 4: Section/chapter — new page, NO header, NO page number; chapter drop; rule 36pt; SECTION N 9pt; title 20pt; 36pt space
      const page = addPage();
      sectionOpenerPageIndices.add(pdfDoc.getPageCount() - 1);
      currentPage = page;
      const chapterDropY = pageHeight / 3;
      const labelText = chapter.title.match(/^Section\s+/i) ? `Section ${chapter.number}` : `Chapter ${chapter.number}`;
      const chapterLabel = labelText.toUpperCase();
      const chapterLabelW = getTextWidth(bodyFont, 9, chapterLabel);
      page.drawText(chapterLabel, {
        x: (pageWidth - chapterLabelW) / 2,
        y: chapterDropY,
        size: 9,
        font: bodyFont,
        color: black,
      });
      const ruleY = chapterDropY - 12;
      const ruleHalf = 18;
      page.drawLine({
        start: { x: (pageWidth - ruleHalf * 2) / 2, y: ruleY },
        end: { x: (pageWidth + ruleHalf * 2) / 2, y: ruleY },
        thickness: 1,
        color: black,
      });
      const titleLines = wrapLines(headingFont, 20, chapter.title, textWidth);
      let titleY = ruleY - 12 - 20;
      for (const line of titleLines) {
        const w = getTextWidth(headingFont, 20, line);
        page.drawText(line, {
          x: (pageWidth - w) / 2,
          y: titleY,
          size: 20,
          font: headingFont,
          color: black,
        });
        titleY -= 24;
      }
      currentY = titleY - 36;
      isFirstParagraphAfterHeading = true;
      for (const p of chapter.paragraphs) {
        drawBodyParagraph(p, isFirstParagraphAfterHeading);
        isFirstParagraphAfterHeading = false;
      }
    } else if (chapter.level === 2) {
      // BUG 4: Level 2 — no new page; 24pt before; heading font 13pt NOT bold; 12pt after; show header and page number
      const needSpace = 24 + 13 + 12 + threeLines;
      if (currentY - needSpace < bodyBottom) {
        ensurePage(true);
        if (currentPage) currentY = bodyTop;
      }
      currentY -= 24;
      ensurePage(true);
      const h2Lines = wrapLines(headingFont, 13, chapter.title, textWidth);
      for (const line of h2Lines) {
        if (currentY < bodyBottom + 13) {
          ensurePage(true);
          if (currentPage) currentY = bodyTop;
        }
        if (!currentPage) break;
        currentPage.drawText(line, {
          x: insideMargin,
          y: currentY,
          size: 13,
          font: bodyFont,
          color: black,
        });
        currentY -= 15;
      }
      currentY -= 12;
      isFirstParagraphAfterHeading = true;
      for (const p of chapter.paragraphs) {
        drawBodyParagraph(p, isFirstParagraphAfterHeading);
        isFirstParagraphAfterHeading = false;
      }
    } else {
      // Fix 5: Subsection (H3) — 18pt before, body bold italic 12pt, 8pt after
      currentY -= 18;
      ensurePage();
      const h3Lines = wrapLines(bodyFontBoldItalic, 12, chapter.title, textWidth);
      for (const line of h3Lines) {
        if (currentY < bodyBottom + 12) {
          ensurePage();
          if (currentPage) currentY = bodyTop;
        }
        if (!currentPage) break;
        currentPage.drawText(line, {
          x: insideMargin,
          y: currentY,
          size: 12,
          font: bodyFontBoldItalic,
          color: black,
        });
        currentY -= 14;
      }
      currentY -= 8;
      isFirstParagraphAfterHeading = true;
      for (const p of chapter.paragraphs) {
        drawBodyParagraph(p, isFirstParagraphAfterHeading);
        isFirstParagraphAfterHeading = false;
      }
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

  // Add page numbers starting at 1 on first body page (skip front matter); BUG 4: skip section opener pages
  const pages = pdfDoc.getPages();
  let num = 1;
  for (let i = frontMatterPages; i < pages.length; i++) {
    if (sectionOpenerPageIndices.has(i)) continue;
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
