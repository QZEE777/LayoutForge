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

/** First 3 paragraphs from word/document.xml body. */
function getFirstParagraphs(docXml: string, maxParagraphs: number = 3): string[] {
  const paragraphs: string[] = [];
  // Match <w:p>...</w:p> - be greedy for content but not across other </w:p>
  const pRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(docXml)) !== null && paragraphs.length < maxParagraphs) {
    const text = getParagraphText(match[1] || "");
    paragraphs.push(text);
  }
  return paragraphs;
}

/** Heuristic: infer title from first non-empty; author from "By ..." or second line. */
function inferFromParagraphs(paragraphs: string[]): { title: string; author: string; hasTitlePage: boolean } {
  const nonEmpty = paragraphs.filter((p) => p.length > 0);
  let title = "";
  let author = "";
  let hasTitlePage = false;

  if (nonEmpty.length >= 1) title = nonEmpty[0];
  if (nonEmpty.length >= 2) {
    const second = nonEmpty[1];
    const byMatch = second.match(/^By\s+(.+)$/i);
    if (byMatch) author = byMatch[1].trim();
    else author = second;
  }

  if (title || author) hasTitlePage = true;
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
    const firstParagraphs = getFirstParagraphs(docXml, 3);
    const inferred = inferFromParagraphs(firstParagraphs);
    if (!bookTitle && inferred.title) bookTitle = inferred.title;
    if (!authorName && inferred.author) authorName = inferred.author;
    if (inferred.hasTitlePage) hasTitlePage = true;
  }

  return NextResponse.json({
    bookTitle: bookTitle || undefined,
    authorName: authorName || undefined,
    hasTitlePage: hasTitlePage || undefined,
  });
}
