/**
 * KDP formatted DOCX (review draft) using the docx package.
 * For proofreading only — not print-ready.
 * Spacing: OOXML uses max(para.after, next.before) between paragraphs (twips).
 * We set beforeAutoSpacing/afterAutoSpacing: false so Word uses our exact values (no extra auto space).
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
import { getTrimSize } from "./kdpConfig";

/** Clean template: one font for entire document. */
const TEMPLATE_FONT = "Times New Roman";
/** Clean template: one body size (12pt). */
const TEMPLATE_BODY_SIZE = 24;
/** Clean template: one line spacing (240 twips = single). */
const TEMPLATE_LINE_TWIP = 240;
/** Clean template: one paragraph spacing after (96 twips). */
const TEMPLATE_PARA_AFTER = 96;
/** Clean template: one heading size (14pt). */
const TEMPLATE_HEADING_SIZE = 28;

const REVIEW_COMMENT =
  "[MANU2PRINT REVIEW DRAFT — Not for print. Edit this document, then return to manu2print to generate your final KDP-ready PDF.]";

export async function generateKdpDocx(
  content: ParsedContent,
  config: KdpFormatConfig
): Promise<Buffer> {
  const trim = getTrimSize(config.trimSize) ?? getTrimSize("6x9");
  if (!trim) throw new Error("Trim size not available.");

  const title = typeof config.bookTitle === "string" ? config.bookTitle : content.frontMatter.title || "Untitled";
  const author = typeof config.authorName === "string" ? config.authorName : content.frontMatter.author || "Unknown Author";
  const copyrightYear = config.copyrightYear;
  const isbn = config.isbn || content.frontMatter.isbn || "";
  const normalRun = (text: string, opts?: { bold?: boolean; italics?: boolean }) =>
    new TextRun({
      text,
      size: TEMPLATE_BODY_SIZE,
      font: TEMPLATE_FONT,
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
          size: TEMPLATE_BODY_SIZE - 4,
          italics: true,
          color: "FF0000",
          font: TEMPLATE_FONT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: TEMPLATE_PARA_AFTER * 2.5 },
    })
  );

  if (config.frontMatter.titlePage) {
    const titleCaps = title.toUpperCase();
    const black = "000000";
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: titleCaps, size: TEMPLATE_HEADING_SIZE * 2, font: TEMPLATE_FONT, bold: true, color: black })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2880, after: 0 },
      })
    );
    frontChildren.push(new Paragraph({ children: [new PageBreak()] }));
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: titleCaps, size: TEMPLATE_HEADING_SIZE * 2, font: TEMPLATE_FONT, bold: true, color: black })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2520, after: TEMPLATE_PARA_AFTER * 5 },
      })
    );
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: `By ${author}`, size: TEMPLATE_HEADING_SIZE, font: TEMPLATE_FONT, color: black })],
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

  // Manual TOC: Heading 1 chapters only
  if (config.frontMatter.toc) {
    const tocEntries = bodyChapters.filter((ch) => ch.level === 1);
    frontChildren.push(
      new Paragraph({
        children: [new TextRun({ text: "Contents", size: TEMPLATE_HEADING_SIZE, font: TEMPLATE_FONT, bold: true, color: "000000" })],
        heading: HeadingLevel.TITLE,
        spacing: { after: TEMPLATE_PARA_AFTER * 2 },
      })
    );
    frontChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "(Page numbers update when opened in Microsoft Word — press Ctrl+A then F9 to refresh)",
            size: TEMPLATE_BODY_SIZE - 4,
            font: TEMPLATE_FONT,
            italics: true,
            color: "000000",
            underline: { type: UnderlineType.NONE },
          }),
        ],
        spacing: { after: TEMPLATE_PARA_AFTER * 4 },
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
      frontChildren.push(
        new Paragraph({
          children: [new TextRun({ text: formatTocTitle(ch.title), size: TEMPLATE_BODY_SIZE, font: TEMPLATE_FONT, color: "000000", underline: { type: UnderlineType.NONE } })],
          spacing: { after: TEMPLATE_PARA_AFTER },
        })
      );
    }
    frontChildren.push(new Paragraph({ children: [new PageBreak()] }));
  }

  const bodyChildren: FileChild[] = [];
  const black = "000000";

  for (let i = 0; i < bodyChapters.length; i++) {
    const ch = bodyChapters[i];
    const headingRun = new TextRun({
      text: ch.title,
      size: TEMPLATE_HEADING_SIZE,
      font: TEMPLATE_FONT,
      bold: true,
      color: black,
    });
    const headingLevel = ch.level === 1 ? HeadingLevel.HEADING_1 : ch.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
    bodyChildren.push(
      new Paragraph({
        children: [headingRun],
        heading: headingLevel,
        pageBreakBefore: ch.level === 1 && i > 0,
        spacing: {
          before: ch.level === 1 && i > 0 ? 240 : 0,
          after: TEMPLATE_PARA_AFTER,
          line: TEMPLATE_LINE_TWIP,
          beforeAutoSpacing: false,
          afterAutoSpacing: false,
        },
      })
    );
    for (const p of ch.paragraphs) {
      const trimmed = p.text.trim();
      if (!trimmed) continue;
      if (/^\d{1,4}$/.test(trimmed)) continue;
      bodyChildren.push(
        new Paragraph({
          style: "Normal",
          children: [normalRun(p.text, { bold: p.bold, italics: p.italic })],
          spacing: {
            before: 0,
            after: TEMPLATE_PARA_AFTER,
            line: TEMPLATE_LINE_TWIP,
            beforeAutoSpacing: false,
            afterAutoSpacing: false,
          },
          indent: { left: 0, right: 0, firstLine: 0 },
          alignment: AlignmentType.LEFT,
        })
      );
    }
  }

  const pageWidth = convertInchesToTwip(trim.widthInches);
  const pageHeight = convertInchesToTwip(trim.heightInches);
  const pageMargin = {
    top: 1080,
    bottom: 1080,
    left: 1008,
    right: 1008,
    gutter: 0,
    header: 576,
    footer: 576,
  };
  const sharedPageProps = {
    margin: pageMargin,
    size: { width: pageWidth, height: pageHeight },
  };

  // Section 1: front matter — no page numbers, no footers
  const frontSection = {
    properties: {
      page: sharedPageProps,
    },
    children: frontChildren,
  };

  // Section 2: body — page numbers start at 1; odd = bottom right, even = bottom left
  const bodySection = {
    properties: {
      page: {
        ...sharedPageProps,
        pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, size: TEMPLATE_BODY_SIZE - 4, italics: true, font: TEMPLATE_FONT })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
      even: new Header({
        children: [
          new Paragraph({
            children: [new TextRun({ text: author, size: TEMPLATE_BODY_SIZE - 4, italics: true, font: TEMPLATE_FONT })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            children: [new TextRun({ children: [PageNumber.CURRENT], size: TEMPLATE_BODY_SIZE - 2, font: TEMPLATE_FONT })],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }),
      even: new Footer({
        children: [
          new Paragraph({
            children: [new TextRun({ children: [PageNumber.CURRENT], size: TEMPLATE_BODY_SIZE - 2, font: TEMPLATE_FONT })],
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
          run: { font: TEMPLATE_FONT, size: TEMPLATE_BODY_SIZE },
        },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: TEMPLATE_FONT, size: TEMPLATE_BODY_SIZE },
        },
      ],
    },
    sections: [frontSection, bodySection],
  });

  return Packer.toBuffer(doc);
}
