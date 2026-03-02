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
import JSZip from "jszip";
import type { ParsedContent, ParsedChapter, ParsedParagraph } from "./kdpDocxParser";
import type { KdpFormatConfig } from "./kdpConfig";
import { getTrimSize, BODY_FONTS } from "./kdpConfig";

/** KDP-approved fonts (replace any other font with Times New Roman in pass-through). */
const KDP_FONTS = new Set([
  "Times New Roman",
  "Arial",
  "Georgia",
  "Palatino Linotype",
  "Cambria",
  "Verdana",
  "Book Antiqua",
  "Courier New",
  "Lucida Sans",
  "Trebuchet MS",
  "EB Garamond",
  "Libre Baskerville",
]);

/** Resolve body font display name from config id. */
function getBodyFontName(fontId: string): string {
  const found = BODY_FONTS.find((f) => f.id === fontId);
  return found ? found.name.split("—")[0].trim() : "Times New Roman";
}

function isKdpFont(fontName: string): boolean {
  if (!fontName || !fontName.trim()) return false;
  const normalized = fontName.trim();
  return KDP_FONTS.has(normalized) || Array.from(KDP_FONTS).some((f) => f.toLowerCase() === normalized.toLowerCase());
}

/**
 * Pass-through post-process: inject original <w:pPr> into body content paragraphs and replace non-KDP fonts.
 */
async function injectPassThrough(buffer: Buffer, bodyContentPprXmls: string[]): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  let xml = (await zip.file("word/document.xml")?.async("string")) || "";

  const paraRegex = /<w:p[ >][\s\S]*?<\/w:p>/g;
  const paras: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = paraRegex.exec(xml)) !== null) paras.push(m[0]);

  let bodyStartIndex = -1;
  for (let i = 0; i < paras.length; i++) {
    if (paras[i].includes("<w:sectPr")) {
      bodyStartIndex = i;
      break;
    }
  }
  if (bodyStartIndex < 0) return buffer;

  let contentIdx = 0;
  for (let i = bodyStartIndex + 1; i < paras.length; i++) {
    const p = paras[i];
    const isHeading = /<w:pStyle\s+w:val="Heading\s*\d"/i.test(p) || /<w:pStyle\s+w:val="Heading\d"/i.test(p);
    if (isHeading) continue;
    const pprXml = bodyContentPprXmls[contentIdx++] ?? "";
    if (pprXml) {
      paras[i] = p.replace(/<w:pPr[\s\S]*?<\/w:pPr>/, pprXml);
    }
  }

  let paraIndex = 0;
  xml = xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, () => paras[paraIndex++] ?? "");

  const replacementFont = "Times New Roman";
  xml = xml.replace(/<w:rFonts\s+([^>]*)\/?>/g, (_, attrs) => {
    const fix = (attr: string, val: string) => (isKdpFont(val) ? val : replacementFont);
    let out = attrs
      .replace(/w:ascii="([^"]*)"/g, (_m: string, val: string) => `w:ascii="${fix("ascii", val)}"`)
      .replace(/w:hAnsi="([^"]*)"/g, (_m: string, val: string) => `w:hAnsi="${fix("hAnsi", val)}"`)
      .replace(/w:cs="([^"]*)"/g, (_m: string, val: string) => `w:cs="${fix("cs", val)}"`);
    return `<w:rFonts ${out}/>`;
  });

  zip.file("word/document.xml", xml);
  return Buffer.from(await zip.generateAsync({ type: "nodebuffer" }));
}

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
  const lineTwip = 240; // single line spacing (tighter); was 276

  const bodySize = 24; // 12pt standard for nonfiction print
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
  const colonLabelRun = (text: string) =>
    new TextRun({
      text,
      size: 26,
      font: bodyFontName,
      bold: true,
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
  const bodyContentPprXmls: string[] = [];
  const black = "000000";
  const alreadyFormatted = !!config.alreadyFormatted;

  for (let i = 0; i < bodyChapters.length; i++) {
    const ch = bodyChapters[i];
    const prevLevel = i > 0 ? bodyChapters[i - 1].level : null;
    if (ch.level === 1) {
      const dashSplit = ch.title.split(/\s+[—–-]\s+/);
      const chapterLabel = (dashSplit[0] || ch.title).trim().toUpperCase();
      const subtitleFull = dashSplit.length > 1 ? dashSplit.slice(1).join(" — ").trim() : "";
      const colonMatch = subtitleFull.match(/^(.+?)\s*:\s*(.+)$/);
      let subtitleLine2 = colonMatch ? colonMatch[1].replace(/:+\s*$/, "").trim() : subtitleFull;
      let subSubtitle = colonMatch ? colonMatch[2].trim() : "";
      const toTitleCase = (s: string) =>
        s.trim().split(/\s+/).map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(" ");
      if (subtitleLine2 && /^[A-Z\s]+$/.test(subtitleLine2) && subtitleLine2.length > 0)
        subtitleLine2 = toTitleCase(subtitleLine2);
      if (subSubtitle && /^[A-Z\s]+$/.test(subSubtitle) && subSubtitle.length > 0) subSubtitle = toTitleCase(subSubtitle);
      const hasSubtitle = !!subtitleLine2;
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: chapterLabel, size: 28, font: "Times New Roman", bold: true, color: black })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
          spacing: { before: 240, after: 0, line: lineTwip, beforeAutoSpacing: false, afterAutoSpacing: false },
        })
      );
      if (subtitleLine2) {
        bodyChildren.push(
          new Paragraph({
            children: [new TextRun({ text: subtitleLine2, size: 26, font: "Times New Roman", color: black })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0, line: lineTwip, beforeAutoSpacing: false, afterAutoSpacing: false },
          })
        );
      }
      if (subSubtitle) {
        bodyChildren.push(
          new Paragraph({
            children: [new TextRun({ text: subSubtitle, size: 22, font: "Times New Roman", italics: true, color: black })],
            heading: HeadingLevel.HEADING_3,
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0, line: lineTwip, beforeAutoSpacing: false, afterAutoSpacing: false },
          })
        );
      }
    } else if (ch.level === 2) {
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, size: 26, font: "Times New Roman", bold: true, color: black })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 96, after: 96, line: lineTwip, beforeAutoSpacing: false, afterAutoSpacing: false },
        })
      );
    } else {
      bodyChildren.push(
        new Paragraph({
          children: [new TextRun({ text: ch.title, size: 22, font: "Times New Roman", italics: true, color: black })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 0, after: 0, line: lineTwip, beforeAutoSpacing: false, afterAutoSpacing: false },
        })
      );
    }
    const paras = ch.paragraphs;
    if (alreadyFormatted) {
      for (let j = 0; j < paras.length; j++) {
        const p = paras[j];
        const trimmed = p.text.trim();
        if (!trimmed) continue;
        if (/^\d{1,4}$/.test(trimmed)) continue;
        bodyContentPprXmls.push((p as ParsedParagraph & { rawPprXml?: string }).rawPprXml ?? "");
        bodyChildren.push(
          new Paragraph({
            style: "Normal",
            children: [normalRun(p.text, { bold: p.bold, italics: p.italic })],
          })
        );
      }
    } else {
      let prevWasColonLabel = false;
      let prevWasListItem = false;
      let prevWasSubheadingLike = false;
      for (let j = 0; j < paras.length; j++) {
        const p = paras[j];
        const trimmed = p.text.trim();
        if (!trimmed) continue;
        if (/^\d{1,4}$/.test(trimmed)) continue;
        const isListItem = /^[•\-*▲\u25B2\u2022]\s*/.test(trimmed) || /^\d+\.\s+/.test(trimmed);
        const isColonLabel = /:\s*$/.test(trimmed);
        const isSubheadingLike = !isListItem && !isColonLabel && !!p.bold && trimmed.length < 120;
        let nextIsListItem = false;
        let nextIsColonLabel = false;
        let nextIsSubheadingLike = false;
        for (let k = j + 1; k < paras.length; k++) {
          const t = paras[k].text.trim();
          if (!t || /^\d{1,4}$/.test(t)) continue;
          nextIsListItem = /^[•\-*▲\u25B2\u2022]\s*/.test(t) || /^\d+\.\s+/.test(t);
          nextIsColonLabel = /:\s*$/.test(t);
          nextIsSubheadingLike = !nextIsListItem && !nextIsColonLabel && !!paras[k].bold && t.length < 120;
          break;
        }
        const isShortCallout = !isListItem && !isColonLabel && trimmed.length < 80;
        const isItalicCallout = !isListItem && !isColonLabel && p.italic && trimmed.length < 120;
        const isPunchyShort = !isListItem && !isColonLabel && trimmed.length < 60 && /\.\s*$/.test(trimmed) && !p.bold && !p.italic;
        const afterSpacing = isListItem ? 32 : isColonLabel ? 12 : isSubheadingLike ? 96 : isItalicCallout ? 160 : isPunchyShort ? 48 : isShortCallout ? 64 : 96;
        let beforeSpacing = prevWasColonLabel ? 0 : prevWasSubheadingLike && isSubheadingLike ? 48 : prevWasSubheadingLike ? 96 : prevWasListItem ? 64 : isColonLabel ? 160 : isSubheadingLike ? 0 : 0;
        let lineSpacing = isListItem ? 228 : lineTwip;
        let finalAfter = afterSpacing;
        if (prevWasColonLabel) {
          beforeSpacing = 0;
          finalAfter = 96;
          lineSpacing = lineTwip;
        }
        prevWasColonLabel = isColonLabel;
        prevWasListItem = isListItem;
        prevWasSubheadingLike = isSubheadingLike;
        const run = isColonLabel ? colonLabelRun(p.text) : normalRun(p.text, { bold: p.bold, italics: p.italic });
        bodyChildren.push(
          new Paragraph({
            style: "Normal",
            children: [run],
            spacing: {
              before: beforeSpacing,
              after: finalAfter,
              line: lineSpacing,
              beforeAutoSpacing: false,
              afterAutoSpacing: false,
            },
            indent: { left: 0, right: 0, firstLine: 0 },
            alignment: AlignmentType.LEFT,
            keepNext: isColonLabel || (nextIsListItem && !isListItem) || nextIsColonLabel || isListItem || isSubheadingLike || nextIsSubheadingLike,
            keepLines: isListItem,
            widowControl: true,
          })
        );
      }
    }
  }

  const kdpTrim = getTrimSize("6x9");
  const effectiveTrim = alreadyFormatted && kdpTrim ? kdpTrim : trim;
  const pageWidth = convertInchesToTwip(effectiveTrim.widthInches);
  const pageHeight = convertInchesToTwip(effectiveTrim.heightInches);

  // KDP standard when pass-through: 0.75" top/bottom, 0.875" inside, 0.625" outside; mirror for verso/recto.
  const KDP_MARGIN_TOP_BOTTOM = 1080;
  const KDP_MARGIN_INSIDE = 1260;
  const KDP_MARGIN_OUTSIDE = 900;
  const pageMargin = alreadyFormatted
    ? {
        top: KDP_MARGIN_TOP_BOTTOM,
        bottom: KDP_MARGIN_TOP_BOTTOM,
        left: KDP_MARGIN_OUTSIDE,
        right: KDP_MARGIN_INSIDE,
        gutter: 0,
        header: 576,
        footer: 576,
      }
    : {
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
    ...(alreadyFormatted && { mirrorMargins: true }),
    ...(!alreadyFormatted && { mirrorMargins: false }),
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

  const buf = await Packer.toBuffer(doc);
  if (alreadyFormatted && bodyContentPprXmls.length > 0) {
    return injectPassThrough(buf, bodyContentPprXmls);
  }
  return buf;
}
