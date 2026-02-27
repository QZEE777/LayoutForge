/**
 * KDP formatted DOCX (review draft) using the docx package.
 * For proofreading only — not print-ready.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  AlignmentType,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
  type FileChild,
} from "docx";
import type { ParsedContent, ParsedChapter } from "./kdpDocxParser";
import type { KdpFormatConfig } from "./kdpConfig";
import { getTrimSize, getGutterInches, BODY_FONTS } from "./kdpConfig";

/** Resolve body font display name from config id. */
function getBodyFontName(fontId: string): string {
  const found = BODY_FONTS.find((f) => f.id === fontId);
  return found ? found.name.split("—")[0].trim() : "Times New Roman";
}

const REVIEW_COMMENT =
  "[SCRIBESTACK REVIEW DRAFT — Not for print. Edit this document, then return to ScribeStack to generate your final KDP-ready PDF.]";

export async function generateKdpDocx(
  content: ParsedContent,
  config: KdpFormatConfig
): Promise<Buffer> {
  const trim = getTrimSize(config.trimSize);
  if (!trim) throw new Error(`Unknown trim size: ${config.trimSize}`);
  const gutterInches = getGutterInches(content.estimatedPageCount);
  const marginInches = 0.75;
  const top = marginInches;
  const bottom = marginInches;
  const left = marginInches + gutterInches;
  const right = marginInches;
  const headerInches = 0.4;
  const footerInches = 0.4;

  const title = typeof config.bookTitle === "string" ? config.bookTitle : content.frontMatter.title || "Untitled";
  const author = typeof config.authorName === "string" ? config.authorName : content.frontMatter.author || "Unknown Author";
  const copyrightYear = config.copyrightYear;
  const isbn = config.isbn || content.frontMatter.isbn || "";
  const fontSize = config.fontSize;
  const lineSpacing = config.lineSpacing ?? 1.3;
  const lineTwip = Math.round(240 * lineSpacing); // ~12pt * 20 * lineSpacing

  const bodySize = fontSize * 2; // half-points
  const bodyFontName = getBodyFontName(config.bodyFont);
  const normalRun = (text: string, opts?: { bold?: boolean; italics?: boolean }) =>
    new TextRun({
      text,
      size: bodySize,
      font: bodyFontName,
      ...opts,
    });

  const frontChildren: FileChild[] = [];

  // Review draft comment — red, italic, 10pt, centered
  frontChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: REVIEW_COMMENT,
          size: 20,
          italics: true,
          color: "FF0000",
          font: "Times New Roman",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  );

  // Half title
  if (config.frontMatter.titlePage) {
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: title, size: 48, font: "Times New Roman", bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2880, after: 0 },
      })
    );
    frontChildren.push(new Paragraph({ children: [new PageBreak()] }));

    // Full title page
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: title, size: 56, font: "Times New Roman", bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2520, after: 480 },
      })
    );
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "By", size: 22, font: "Times New Roman" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      })
    );
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: author, size: 28, font: "Times New Roman" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
      })
    );
    frontChildren.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // Copyright page
  if (config.frontMatter.copyrightPage) {
    const copyLines = [
      `Copyright © ${copyrightYear} ${author}. All rights reserved.`,
      "",
      "Printed in the United States of America.",
      "First Edition.",
      ...(isbn ? ["", `ISBN: ${isbn}`] : []),
    ];
    for (const line of copyLines) {
      frontChildren.push(
        new Paragraph({
          children: line ? [normalRun(line)] : [],
          alignment: AlignmentType.CENTER,
          spacing: { before: line ? 0 : 200, after: 0 },
        })
      );
    }
    frontChildren.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // TOC placeholder
  if (config.frontMatter.toc) {
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "Contents", size: 36, font: "Times New Roman", bold: true })],
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      })
    );
    frontChildren.push(
      new Paragraph({
        children: [normalRun("(Table of contents will be generated in the final PDF.)", { italics: true })],
        spacing: { after: 400 },
      })
    );
    frontChildren.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // Body: chapters with Heading1/2/3 and Normal paragraphs. Skip title-page content that leaked into parsed chapters.
  const isTitlePageContent = (ch: ParsedChapter): boolean => {
    const t = ch.title.trim();
    if (t === title.trim()) return true;
    if (t === `By ${author}`.trim() || t === `By ${author.trim()}`) return true;
    if (t === author.trim()) return true;
    if (/^By\s+/i.test(t) && t.toLowerCase().endsWith(author.trim().toLowerCase())) return true;
    return false;
  };
  const bodyChapters = content.chapters.filter((ch) => !isTitlePageContent(ch));

  const bodyChildren: FileChild[] = [];
  for (const ch of bodyChapters) {
    if (ch.level === 1) {
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, size: 44, font: "Times New Roman", bold: true })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
          spacing: { before: 0, after: 360, line: lineTwip },
        })
      );
    } else if (ch.level === 2) {
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, size: 26, font: "Times New Roman" })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 480, after: 240, line: lineTwip },
        })
      );
    } else {
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, size: 24, font: "Times New Roman", bold: true, italics: true })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 360, after: 160, line: lineTwip },
        })
      );
    }
    for (const p of ch.paragraphs) {
      bodyChildren.push(
        new Paragraph({
          style: "Normal",
          children: [normalRun(p.text, { bold: p.bold, italics: p.italic })],
          spacing: {
            before: config.paragraphStyle === "nonfiction" ? 200 : 0,
            after: config.paragraphStyle === "nonfiction" ? 200 : 0,
            line: lineTwip,
          },
          indent: config.paragraphStyle === "fiction" ? { firstLine: convertInchesToTwip(0.25) } : undefined,
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
  }

  const pageWidth = convertInchesToTwip(trim.widthInches);
  const pageHeight = convertInchesToTwip(trim.heightInches);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: bodyFontName,
            size: bodySize,
          },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            font: bodyFontName,
            size: bodySize,
          },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(top),
              right: convertInchesToTwip(right),
              bottom: convertInchesToTwip(bottom),
              left: convertInchesToTwip(left),
              header: convertInchesToTwip(headerInches),
              footer: convertInchesToTwip(footerInches),
              gutter: convertInchesToTwip(gutterInches),
            },
            size: { width: pageWidth, height: pageHeight },
            // @ts-expect-error - mirrorMargins not in docx types but supported in OOXML (w:mirrorMargins)
            mirrorMargins: true,
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    size: 18,
                    italics: true,
                    font: "Times New Roman",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          even: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: author,
                    size: 18,
                    italics: true,
                    font: "Times New Roman",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 20,
                    font: "Times New Roman",
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [...frontChildren, ...bodyChildren],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
