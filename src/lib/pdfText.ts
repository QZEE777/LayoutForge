/**
 * PDF-only text extraction using unpdf (PDF.js). Use this path only for PDF buffers.
 * DOCX extraction lives in each route via mammoth.
 */
import { extractText, getDocumentProxy } from "unpdf";

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (text || "").replace(/\s+/g, " ").trim();
}
