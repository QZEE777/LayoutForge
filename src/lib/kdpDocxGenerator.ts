/**
 * KDP DOCX generator — surgical XML-only edits.
 * Loads the ORIGINAL DOCX, applies only: pgSz, pgMar, pageBreakBefore on chapter headings,
 * widowControl on body paragraphs, fix double spaces in w:t. Prepends compliance report page.
 * Does NOT rebuild content; preserves all original fonts and styles.
 */

import JSZip from "jszip";
import type { KdpFormatConfig } from "./kdpConfig";
import { getTrimSize, getGutterInches } from "./kdpConfig";

const TWIPS_PER_INCH = 1440;

/** Escape text for use inside an XML text node (e.g. w:t). */
function escapeXmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build a single paragraph XML for a line of text (plain run, no style).
 */
function paragraphWithText(text: string): string {
  const safe = escapeXmlText(text);
  return `<w:p><w:r><w:t>${safe}</w:t></w:r></w:p>`;
}

/**
 * Prepend compliance report as the first page: report paragraphs + page break, then original body content.
 */
function prependReportPage(bodyXml: string, reportText: string): string {
  const lines = reportText.split(/\r?\n/);
  const reportParas = lines.map((line) => paragraphWithText(line.trim() === "" ? " " : line));
  const pageBreakPara = `<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>`;
  const reportBlock = reportParas.join("") + pageBreakPara;

  const bodyOpen = "<w:body>";
  const idx = bodyXml.indexOf(bodyOpen);
  if (idx === -1) return bodyXml;
  return bodyXml.slice(0, idx + bodyOpen.length) + reportBlock + bodyXml.slice(idx + bodyOpen.length);
}

/**
 * Replace all w:pgSz with new trim size (twips).
 */
function applyPageSize(xml: string, widthTwips: number, heightTwips: number): string {
  return xml.replace(
    /<w:pgSz[^>]*\/>/g,
    `<w:pgSz w:w="${widthTwips}" w:h="${heightTwips}"/>`
  );
}

/**
 * Replace all w:pgMar with KDP margins (twips). left = 0.5" + gutter.
 */
function applyMargins(
  xml: string,
  gutterTwips: number,
  top = 720,
  right = 720,
  bottom = 720,
  header = 720,
  footer = 720
): string {
  const leftTwips = 720 + gutterTwips;
  return xml.replace(
    /<w:pgMar[^>]*\/>/g,
    `<w:pgMar w:top="${top}" w:right="${right}" w:bottom="${bottom}" w:left="${leftTwips}" w:header="${header}" w:footer="${footer}" w:gutter="${gutterTwips}"/>`
  );
}

/**
 * Add w:pageBreakBefore to paragraph properties of chapter headings (Heading1) that don't have it.
 */
function addPageBreakBeforeToChapterHeadings(xml: string): string {
  const pRegex = /<w:p(\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  return xml.replace(pRegex, (full, _attr, inner) => {
    const hasHeading1 =
      /<w:pStyle\s+w:val="Heading\s*1"/i.test(inner) ||
      /<w:pStyle\s+w:val="Heading1"/i.test(inner);
    if (!hasHeading1) return full;
    if (/<w:pageBreakBefore\s*\/?>/.test(inner)) return full;

    if (/<w:pPr\s*[^>]*>/.test(inner)) {
      return full.replace(
        /(<w:pPr\s*[^>]*)>/,
        "$1><w:pageBreakBefore/>"
      );
    }
    return full.replace(
      /<w:p(\s[^>]*)?>/,
      "<w:p$1><w:pPr><w:pageBreakBefore/></w:pPr>"
    );
  });
}

/**
 * Add w:widowControl to body paragraphs (no Heading style) that don't have it.
 */
function addWidowControlToBodyParagraphs(xml: string): string {
  const pRegex = /<w:p(\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
  return xml.replace(pRegex, (full, _attr, inner) => {
    const hasHeading =
      /<w:pStyle\s+w:val="Heading\s*[123]"/i.test(inner) ||
      /<w:pStyle\s+w:val="Heading[123]"/i.test(inner);
    if (hasHeading) return full;
    if (/<w:widowControl\s*\/?>/.test(inner)) return full;

    if (/<w:pPr\s*[^>]*>/.test(inner)) {
      return full.replace(
        /(<w:pPr\s*[^>]*)>/,
        "$1><w:widowControl/>"
      );
    }
    return full.replace(
      /<w:p(\s[^>]*)?>/,
      "<w:p$1><w:pPr><w:widowControl/></w:pPr>"
    );
  });
}

/**
 * Fix double (or more) spaces inside w:t text nodes.
 */
function fixDoubleSpacesInTextNodes(xml: string): string {
  return xml.replace(
    /<w:t(\s[^>]*)?>([\s\S]*?)<\/w:t>/g,
    (_, attrs, content) => {
      const fixed = content.replace(/  +/g, " ");
      const a = typeof attrs === "string" ? attrs : "";
      return `<w:t${a}>${fixed}</w:t>`;
    }
  );
}

/**
 * Surgical generator: original DOCX buffer + config + compliance report text.
 * Returns new DOCX buffer with only the specified XML edits; fonts and styles unchanged.
 */
export async function generateKdpDocx(
  originalDocxBuffer: Buffer,
  config: KdpFormatConfig,
  options: {
    complianceReportText: string;
    estimatedPageCount: number;
  }
): Promise<Buffer> {
  const trim = getTrimSize(config.trimSize) ?? getTrimSize("6x9");
  if (!trim) throw new Error("Trim size not available.");

  const widthTwips = Math.round(trim.widthInches * TWIPS_PER_INCH);
  const heightTwips = Math.round(trim.heightInches * TWIPS_PER_INCH);
  const gutterInches = getGutterInches(options.estimatedPageCount);
  const gutterTwips = Math.round(gutterInches * TWIPS_PER_INCH);

  const zip = await JSZip.loadAsync(originalDocxBuffer);
  let xml = (await zip.file("word/document.xml")?.async("string")) || "";

  xml = applyPageSize(xml, widthTwips, heightTwips);
  xml = applyMargins(xml, gutterTwips);
  xml = addPageBreakBeforeToChapterHeadings(xml);
  xml = addWidowControlToBodyParagraphs(xml);
  xml = fixDoubleSpacesInTextNodes(xml);
  xml = prependReportPage(xml, options.complianceReportText);

  zip.file("word/document.xml", xml, { binary: false });

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}
