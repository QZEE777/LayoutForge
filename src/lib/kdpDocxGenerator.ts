/**
 * KDP DOCX generator: one template (Times New Roman, single spacing, one heading style).
 * Builds title page, copyright, TOC, and body from ParsedContent + KdpFormatConfig.
 * Skips pre-chapter bucket (empty title) and title-page-like chapters from body.
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

const FONT = "Times New Roman";
const BODY_SIZE = 24;
const LINE_TWIP = 240;
const PARA_AFTER = 96;
const HEADING_SIZE = 28;

const REVIEW_BANNER =
  "Manu2Print KDP — Review draft. Edit in Word, then return to generate your final KDP-ready PDF.";

export async function generateKdpDocx(
  content: ParsedContent,
  config: KdpFormatConfig
): Promise<Buffer> {
  const trim = getTrimSize(config.trimSize) ?? getTrimSize("6x9");
  if (!trim) throw new Error("Trim size not available.");

  const title =
    typeof config.bookTitle === "string" && config.bookTitle.trim()
      ? config.bookTitle
      : content.frontMatter.title || "Untitled";
  const author =
    typeof config.authorName === "string" && config.authorName.trim()
      ? config.authorName
      : content.frontMatter.author || "Unknown Author";
  const year = config.copyrightYear;
  const isbn = config.isbn || content.frontMatter.isbn || "";

  const run = (text: string, opts?: { bold?: boolean; italics?: boolean }) =>
    new TextRun({
      text,
      size: BODY_SIZE,
      font: FONT,
      bold: opts?.bold === true,
      italics: opts?.italics === true,
      color: "000000",
    });

  const front: FileChild[] = [];

  front.push(
    new Paragraph({
      children: [
        new TextRun({
          text: REVIEW_BANNER,
          size: BODY_SIZE - 4,
          italics: true,
          color: "FF0000",
          font: FONT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: PARA_AFTER * 2.5 },
    })
  );

  if (config.frontMatter.titlePage) {
    const titleCaps = title.toUpperCase();
    front.push(
      new Paragraph({
        children: [
          new TextRun({
            text: titleCaps,
            size: HEADING_SIZE * 2,
            font: FONT,
            bold: true,
            color: "000000",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2880, after: 0 },
      })
    );
    front.push(new Paragraph({ children: [new PageBreak()] }));
    front.push(
      new Paragraph({
        children: [
          new TextRun({
            text: titleCaps,
            size: HEADING_SIZE * 2,
            font: FONT,
            bold: true,
            color: "000000",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2520, after: PARA_AFTER * 5 },
      })
    );
    front.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `By ${author}`,
            size: HEADING_SIZE,
            font: FONT,
            color: "000000",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
      })
    );
    front.push(new Paragraph({ children: [new PageBreak()] }));
  }

  if (config.frontMatter.copyrightPage) {
    const lines = [
      `Copyright © ${year} ${author}. All rights reserved.`,
      "",
      "Printed in the United States of America.",
      "First Edition.",
      ...(isbn ? ["", `ISBN: ${isbn}`] : []),
    ];
    for (const line of lines) {
      front.push(
        new Paragraph({
          children: line ? [run(line)] : [],
          alignment: AlignmentType.CENTER,
          spacing: { before: line ? 0 : 200, after: 0 },
        })
      );
    }
    front.push(new Paragraph({ children: [new PageBreak()] }));
  }

  if (config.frontMatter.dedication && config.frontMatter.dedicationText?.trim()) {
    front.push(
      new Paragraph({
        children: [
          new TextRun({
            text: config.frontMatter.dedicationText.trim(),
            size: BODY_SIZE,
            font: FONT,
            italics: true,
            color: "000000",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: PARA_AFTER * 4, after: PARA_AFTER * 4 },
      })
    );
    front.push(new Paragraph({ children: [new PageBreak()] }));
  }

  const isTitleLike = (ch: ParsedChapter): boolean => {
    const t = ch.title.trim();
    if (!t) return false;
    if (t === title.trim()) return true;
    if (t === author.trim()) return true;
    if (t === `By ${author}`.trim()) return true;
    if (/^By\s+/i.test(t) && t.toLowerCase().endsWith(author.trim().toLowerCase())) return true;
    return false;
  };
  const isPreChapter = (ch: ParsedChapter): boolean => !ch.title.trim();

  let bodyChapters = content.chapters.filter((ch) => !isPreChapter(ch) && !isTitleLike(ch));

  if (!config.frontMatter.titlePage) {
    const firstH1 = bodyChapters.findIndex((ch) => ch.level === 1);
    if (firstH1 > 0) bodyChapters = bodyChapters.slice(firstH1);
  }

  if (config.frontMatter.toc) {
    const tocChapters = bodyChapters.filter((ch) => ch.level === 1);
    front.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Contents",
            size: HEADING_SIZE,
            font: FONT,
            bold: true,
            color: "000000",
          }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: PARA_AFTER * 2 },
      })
    );
    front.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "(Page numbers update when opened in Microsoft Word — press Ctrl+A then F9 to refresh)",
            size: BODY_SIZE - 4,
            font: FONT,
            italics: true,
            color: "000000",
            underline: { type: UnderlineType.NONE },
          }),
        ],
        spacing: { after: PARA_AFTER * 4 },
      })
    );
    for (const ch of tocChapters) {
      const raw = ch.title;
      const dashSplit = raw.split(/\s+[—–-]\s+/);
      const label = (dashSplit[0] || raw).trim().toUpperCase();
      const rest = dashSplit.length > 1 ? dashSplit.slice(1).join(" — ").trim() : "";
      const tocText = rest ? `${label} — ${rest}` : label;
      const display = tocText.length > 100 ? tocText.slice(0, 97) + "..." : tocText;
      front.push(
        new Paragraph({
          children: [
            new TextRun({
              text: display,
              size: BODY_SIZE,
              font: FONT,
              color: "000000",
              underline: { type: UnderlineType.NONE },
            }),
          ],
          spacing: { after: PARA_AFTER },
        })
      );
    }
    front.push(new Paragraph({ children: [new PageBreak()] }));
  }

  const bodyChildren: FileChild[] = [];
  for (let i = 0; i < bodyChapters.length; i++) {
    const ch = bodyChapters[i];
    const lvl =
      ch.level === 1
        ? HeadingLevel.HEADING_1
        : ch.level === 2
          ? HeadingLevel.HEADING_2
          : HeadingLevel.HEADING_3;
    bodyChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: ch.title,
            size: HEADING_SIZE,
            font: FONT,
            bold: true,
            color: "000000",
          }),
        ],
        heading: lvl,
        pageBreakBefore: ch.level === 1 && i > 0,
        keepNext: true,
        spacing: {
          before: ch.level === 1 && i > 0 ? 240 : 0,
          after: PARA_AFTER,
          line: LINE_TWIP,
          beforeAutoSpacing: false,
          afterAutoSpacing: false,
        },
      })
    );
    for (let j = 0; j < ch.paragraphs.length; j++) {
      const p = ch.paragraphs[j];
      const t = p.text.trim();
      if (!t) continue;
      if (/^\d{1,4}$/.test(t)) continue;
      const isLast = j === ch.paragraphs.length - 1;
      const nextIsChapter = isLast && i + 1 < bodyChapters.length;
      bodyChildren.push(
        new Paragraph({
          style: "Normal",
          children: [run(p.text, { bold: p.bold, italics: p.italic })],
          spacing: {
            before: 0,
            after: PARA_AFTER,
            line: LINE_TWIP,
            beforeAutoSpacing: false,
            afterAutoSpacing: false,
          },
          indent: { left: 0, right: 0, firstLine: 0 },
          alignment: AlignmentType.LEFT,
          keepNext: nextIsChapter,
          widowControl: true,
        })
      );
    }
  }

  const pageSize = {
    width: convertInchesToTwip(trim.widthInches),
    height: convertInchesToTwip(trim.heightInches),
  };
  const margin = {
    top: 1080,
    bottom: 1080,
    left: 1008,
    right: 1008,
    gutter: 0,
    header: 576,
    footer: 576,
  };

  const frontSection = {
    properties: { page: { margin, size: pageSize } },
    children: front,
  };

  const bodySection = {
    properties: {
      page: {
        margin,
        size: pageSize,
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
                size: BODY_SIZE - 4,
                italics: true,
                font: FONT,
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
                size: BODY_SIZE - 4,
                italics: true,
                font: FONT,
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
                size: BODY_SIZE - 2,
                font: FONT,
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
                size: BODY_SIZE - 2,
                font: FONT,
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
        document: { run: { font: FONT, size: BODY_SIZE } },
      },
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: FONT, size: BODY_SIZE },
        },
      ],
    },
    sections: [frontSection, bodySection],
  });

  return Packer.toBuffer(doc);
}
