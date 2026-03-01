/**
 * GET /api/docx-meta?id=<uploadId>
 * Extracts book title, author, and optional hasTitlePage from a stored DOCX.
 * Used to pre-fill the KDP formatter Configure step.
 */

import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { readStoredFile } from "@/lib/storage";

function extractTextFromXmlTag(xml: string, localName: string, nsPrefix: string): string {
  const prefixed = new RegExp(`<${nsPrefix}:${localName}[^>]*>([^<]*)<\\/${nsPrefix}:${localName}>`, "i");
  const m = xml.match(prefixed);
  if (m) return (m[1] || "").trim();
  const anyNs = new RegExp(`<[^:>]*:${localName}[^>]*>([^<]*)<\\/[^:>]*:${localName}>`, "i");
  const m2 = xml.match(anyNs);
  if (m2) return (m2[1] || "").trim();
  return "";
}

function getCoreProps(xml: string): { title: string; creator: string } {
  const title = extractTextFromXmlTag(xml, "title", "dc");
  const creator = extractTextFromXmlTag(xml, "creator", "dc");
  return { title, creator };
}

/** Extract plain text from a single OOXML paragraph (w:p). */
function getParagraphText(pXml: string): string {
  const parts: string[] = [];
  const wT = /<w:t[^>]*>([^<]*)<\/w:t>/gi;
  let match: RegExpExecArray | null;
  while ((match = wT.exec(pXml)) !== null) parts.push(match[1] || "");
  return parts.join("").replace(/\s+/g, " ").trim();
}

/** First N paragraphs from word/document.xml body. */
function getFirstParagraphs(docXml: string, maxParagraphs: number = 3): string[] {
  const paragraphs: string[] = [];
  const pRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(docXml)) !== null && paragraphs.length < maxParagraphs) {
    const text = getParagraphText(match[1] || "");
    paragraphs.push(text);
  }
  return paragraphs;
}

/** Looks like a chapter/section heading (stop dedication capture). */
function looksLikeChapterHeading(p: string): boolean {
  const t = p.trim();
  return (
    /^Chapter\s+\d+/i.test(t) ||
    /^Chapter\s+[A-Za-z]+/i.test(t) ||
    /^Part\s+\d+/i.test(t) ||
    /^\d+\.\s+[A-Z]/.test(t) ||
    /^Section\s+\d+/i.test(t)
  );
}

/** Scan first 20 paragraphs for a dedication block; return dedication text or "". */
function inferDedication(paragraphs: string[]): string {
  const max = Math.min(paragraphs.length, 20);
  for (let i = 0; i < max; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;

    // Heading: "Dedication" or "DEDICATION" — capture following paragraph(s)
    if (p === "Dedication" || p === "DEDICATION" || p.toLowerCase() === "dedication") {
      const parts: string[] = [];
      for (let j = i + 1; j < max && parts.length < 5; j++) {
        const next = paragraphs[j].trim();
        if (!next) break;
        if (looksLikeChapterHeading(next)) break;
        parts.push(next);
      }
      if (parts.length > 0) return parts.join("\n\n");
      return "";
    }

    // Short paragraph starting with To / For / Dedicated to
    if (p.length < 150 && /^(To |For |Dedicated to )/i.test(p)) {
      return p;
    }
  }
  return "";
}

/** Convert ALL CAPS string to Title Case. */
function toTitleCase(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/** Infer author only from a paragraph that starts with "By " or "by "; otherwise leave empty. */
function inferAuthor(paragraphs: string[]): string {
  for (const p of paragraphs) {
    const t = p.trim();
    if (!t) continue;
    const byMatch = t.match(/^[Bb]y\s+(.+)$/);
    if (byMatch) {
      const name = byMatch[1].trim();
      if (name.length > 0) return name;
    }
  }
  return "";
}

/** Heuristic: infer title from first non-empty (Title Case if ALL CAPS); author per inferAuthor. */
function inferFromParagraphs(paragraphs: string[]): { title: string; author: string; hasTitlePage: boolean } {
  const nonEmpty = paragraphs.filter((p) => p.length > 0);
  let title = "";
  const author = inferAuthor(nonEmpty);

  if (nonEmpty.length >= 1) {
    const raw = nonEmpty[0];
    title = /^[A-Z\s]+$/.test(raw.trim()) && raw.trim().length > 0 ? toTitleCase(raw) : raw;
  }

  const hasTitlePage = title.length > 0 || author.length > 0;
  return { title, author, hasTitlePage };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const buffer = await readStoredFile(id);
  if (!buffer) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    return NextResponse.json({ error: "Invalid DOCX" }, { status: 400 });
  }

  let bookTitle = "";
  let authorName = "";
  let hasTitlePage = false;
  let dedicationText = "";

  const coreEntry = zip.file("docProps/core.xml");
  if (coreEntry) {
    const coreXml = await coreEntry.async("string");
    const core = getCoreProps(coreXml);
    if (core.title) bookTitle = core.title;
    if (core.creator) authorName = core.creator;
  }

  const docEntry = zip.file("word/document.xml");
  if (docEntry) {
    const docXml = await docEntry.async("string");
    const first20 = getFirstParagraphs(docXml, 20);
    const inferred = inferFromParagraphs(first20.slice(0, 3));
    if (!bookTitle && inferred.title) bookTitle = inferred.title;
    if (!authorName && inferred.author) authorName = inferred.author;
    if (inferred.hasTitlePage) hasTitlePage = true;
    dedicationText = inferDedication(first20);
  }

  return NextResponse.json({
    bookTitle: bookTitle || undefined,
    authorName: authorName || undefined,
    hasTitlePage: hasTitlePage || undefined,
    dedicationText: dedicationText || undefined,
  });
}
