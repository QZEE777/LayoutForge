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
  NumberFormat,
  UnderlineType,
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
  "[MANU2PRINT REVIEW DRAFT — Not for print. Edit this document, then return to manu2print to generate your final KDP-ready PDF.]";

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
  const lineSpacing = config.lineSpacing ?? 1.15;
  const lineTwip = Math.round(240 * lineSpacing); // 276 = 1.15x for print book

  const bodySize = fontSize * 2; // half-points
  const bodyFontName = getBodyFontName(config.bodyFont);
  const normalRun = (text: string, opts?: { bold?: boolean; italics?: boolean }) =>
    new TextRun({
      text,
      size: bodySize,
      font: bodyFontName,
      bold: opts?.bold === true,
      italics: opts?.italics === true,
      color: "000000",
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

  // Generated title page: only when titlePage is true (user did NOT check "skip adding one").
  // When titlePage is false, no half/full title page is added — body starts after review/copyright/TOC.
  if (config.frontMatter.titlePage) {
    const titleCaps = title.toUpperCase();
    const black = "000000";
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: titleCaps, size: 48, font: "Times New Roman", bold: true, color: black })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2880, after: 0 },
      })
    );
    frontChildren.push(new Paragraph({ children: [new PageBreak()] }));

    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: titleCaps, size: 56, font: "Times New Roman", bold: true, color: black })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2520, after: 480 },
      })
    );
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: `By ${author}`, size: 28, font: "Times New Roman", color: black })],
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

  // Body: chapters with Heading1/2/3 and Normal paragraphs. Skip title-page content that leaked into parsed chapters.
  const isTitlePageContent = (ch: ParsedChapter): boolean => {
    const t = ch.title.trim();
    if (t === title.trim()) return true;
    if (t === `By ${author}`.trim() || t === `By ${author.trim()}`) return true;
    if (t === author.trim()) return true;
    if (/^By\s+/i.test(t) && t.toLowerCase().endsWith(author.trim().toLowerCase())) return true;
    return false;
  };
  let bodyChapters = content.chapters.filter((ch) => !isTitlePageContent(ch));

  // When user skipped our title page (titlePage false), strip manuscript's title block so we don't duplicate.
  if (!config.frontMatter.titlePage) {
    const firstLevel1 = bodyChapters.findIndex((ch) => ch.level === 1);
    if (firstLevel1 > 0) bodyChapters = bodyChapters.slice(firstLevel1);
  }

  // Manual TOC: Heading 1 chapters only; black text, no underline/hyperlink; note about page numbers.
  const tocRunOpts = {
    size: bodySize,
    font: bodyFontName,
    color: "000000",
    underline: { type: UnderlineType.NONE },
  };
  if (config.frontMatter.toc) {
    const tocEntries = bodyChapters.filter((ch) => ch.level === 1);
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "Contents", size: 36, font: "Times New Roman", bold: true, color: "000000" })],
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 },
      })
    );
    frontChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "(Page numbers update when opened in Microsoft Word — press Ctrl+A then F9 to refresh)",
            size: 18,
            font: "Times New Roman",
            italics: true,
            color: "000000",
            underline: { type: UnderlineType.NONE },
          }),
        ],
        spacing: { after: 400 },
      })
    );
    const formatTocTitle = (raw: string) => {
      const dashSplit = raw.split(/\s+[—–-]\s+/);
      const chapterLabel = (dashSplit[0] || raw).trim().toUpperCase();
      const subtitleFull = dashSplit.length > 1 ? dashSplit.slice(1).join(" — ").trim() : "";
      const colonMatch = subtitleFull.match(/^(.+?)\s*:\s*(.+)$/);
      const beforeColon = colonMatch ? colonMatch[1].replace(/:+\s*$/, "").trim() : subtitleFull;
      const tocText = beforeColon ? `${chapterLabel} — ${beforeColon}` : chapterLabel;
      return tocText.length > 100 ? tocText.slice(0, 97) + "..." : tocText;
    };
    for (const ch of tocEntries) {
      const titleShort = formatTocTitle(ch.title);
      frontChildren.push(
        new Paragraph({
          children: [new TextRun({ ...tocRunOpts, text: titleShort })],
          spacing: { after: 120 },
        })
      );
    }
    frontChildren.push(new Paragraph({ children: [new PageBreak()] }));
  }

  const bodyChildren: FileChild[] = [];
  const black = "000000";
  for (let i = 0; i < bodyChapters.length; i++) {
    const ch = bodyChapters[i];
    const prevLevel = i > 0 ? bodyChapters[i - 1].level : null;
    if (ch.level === 1) {
      const dashSplit = ch.title.split(/\s+[—–-]\s+/);
      const chapterLabel = (dashSplit[0] || ch.title).trim().toUpperCase();
      const subtitleFull = dashSplit.length > 1 ? dashSplit.slice(1).join(" — ").trim() : "";
      const colonMatch = subtitleFull.match(/^(.+?)\s*:\s*(.+)$/);
      const subtitleLine2 = colonMatch ? colonMatch[1].replace(/:+\s*$/, "").trim() : subtitleFull;
      const subSubtitle = colonMatch ? colonMatch[2].trim() : "";
      const hasSubtitle = !!subtitleLine2;
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: chapterLabel, size: 28, font: "Times New Roman", bold: true, color: black })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
          spacing: { before: 240, after: hasSubtitle ? 0 : 360, line: lineTwip },
        })
      );
      if (subtitleLine2) {
        bodyChildren.push(
          new Paragraph({
            children: [new TextRun({ text: subtitleLine2, size: 24, font: "Times New Roman", color: black })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: subSubtitle ? 0 : 360, line: lineTwip },
          })
        );
      }
      if (subSubtitle) {
        bodyChildren.push(
          new Paragraph({
            children: [new TextRun({ text: subSubtitle, size: 22, font: "Times New Roman", italics: true, color: black })],
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 360, line: lineTwip },
          })
        );
      }
    } else if (ch.level === 2) {
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, size: 24, font: "Times New Roman", bold: true, color: black })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: prevLevel === 1 ? 0 : 240, after: 240, line: lineTwip },
        })
      );
    } else {
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, size: 22, font: "Times New Roman", italics: true, color: black })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 160, line: lineTwip },
        })
      );
    }
    for (const p of ch.paragraphs) {
      if (!p.text.trim()) continue;
      bodyChildren.push(
        new Paragraph({
          style: "Normal",
          children: [normalRun(p.text, { bold: p.bold, italics: p.italic })],
          spacing: {
            before: 0,
            after: 120,
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

  const pageMargin = {
    top: convertInchesToTwip(top),
    right: convertInchesToTwip(right),
    bottom: convertInchesToTwip(bottom),
    left: convertInchesToTwip(left),
    header: convertInchesToTwip(headerInches),
    footer: convertInchesToTwip(footerInches),
    gutter: convertInchesToTwip(gutterInches),
  };

  // Section 1: front matter — no page numbers, no footers
  const frontSection = {
    properties: {
      page: {
        margin: pageMargin,
        size: { width: pageWidth, height: pageHeight },
        // @ts-ignore
        mirrorMargins: true,
      },
    },
    children: frontChildren,
  };

  // Section 2: body — page numbers start at 1; odd = bottom right, even = bottom left
  const bodySection = {
    properties: {
      page: {
        margin: pageMargin,
        size: { width: pageWidth, height: pageHeight },
        // @ts-ignore
        mirrorMargins: true,
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
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
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }),
      even: new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                children: [PageNumber.CURRENT],
                size: 20,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.LEFT,
          }),
        ],
      }),
    },
    children: bodyChildren,
  };

  const doc = new Document({
    evenAndOddHeaderAndFooters: true,
    features: { updateFields: true },
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
    sections: [frontSection, bodySection],
  });

  return Packer.toBuffer(doc);
}
