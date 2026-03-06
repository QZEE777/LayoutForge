/**
 * Build a plain-text export of the full document for AI/KDP format review.
 * User can copy this and paste in chat so the AI can scan the whole manuscript
 * against Amazon KDP rules (margins, spacing, headings, lists, etc.).
 */

import type { ParsedContent, ParsedChapter, ParsedParagraph } from "./kdpDocxParser";
import type { KdpFormatConfig } from "./kdpConfig";

const MAX_LENGTH = 120000; // ~30k words; safe for storage and clipboard

function classifyParagraph(p: ParsedParagraph): "list" | "label" | "body" {
  const t = p.text.trim();
  if (!t) return "body";
  if (/^[•\-*]\s*/.test(t) || /^\d+\.\s+/.test(t)) return "list";
  if (/:\s*$/.test(t)) return "label";
  return "body";
}

export function buildFormatReviewText(content: ParsedContent, config: KdpFormatConfig): string {
  const lines: string[] = [];

  lines.push("--- KDP FORMAT REVIEW (paste this for AI / professional formatter) ---");
  lines.push("");
  lines.push(`Title: ${content.frontMatter.title || config.bookTitle || "Untitled"}`);
  lines.push(`Author: ${content.frontMatter.author || config.authorName || "Unknown"}`);
  lines.push(`Trim: ${config.trimSize} | Body font: ${config.bodyFont} | Est. pages: ${content.estimatedPageCount}`);
  lines.push("");
  if (content.detectedIssues.length > 0) {
    lines.push("Detected issues:");
    content.detectedIssues.forEach((i) => lines.push(`  - ${i}`));
    lines.push("");
  }
  lines.push("--- BODY (structure + text for full-document scan) ---");
  lines.push("");

  let charCount = lines.join("\n").length;

  for (const ch of content.chapters) {
    const levelTag = ch.level === 1 ? "H1" : ch.level === 2 ? "H2" : "H3";
    lines.push(`[${levelTag}] ${ch.title}`);
    charCount += lines[lines.length - 1].length + 1;
    if (charCount >= MAX_LENGTH) break;

    for (const p of ch.paragraphs) {
      if (charCount >= MAX_LENGTH) break;
      const text = p.text.trim();
      if (!text) continue;
      if (/^\d{1,4}$/.test(text)) continue; // skip stray page numbers

      const kind = classifyParagraph(p);
      const prefix = kind === "list" ? "[LIST] " : kind === "label" ? "[LABEL] " : "";
      const line = prefix + text;
      lines.push(line);
      charCount += line.length + 1;
    }
    lines.push("");
    charCount += 1;
  }

  if (charCount >= MAX_LENGTH) {
    lines.push("");
    lines.push("[... document truncated for length. Paste and ask AI to review structure, spacing, and KDP compliance from what is shown above.]");
  }

  return lines.join("\n");
}
