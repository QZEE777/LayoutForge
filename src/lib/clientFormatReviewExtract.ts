/**
 * Client-side text extraction for KDP Format Review.
 * Runs in the browser only – no file is sent to the server, so Vercel's body limit is never hit.
 * Only import from "use client" components.
 */

export async function extractTextFromPdfInBrowser(file: File): Promise<string> {
  if (typeof window === "undefined") throw new Error("extractTextFromPdfInBrowser must run in the browser.");
  const { getDocumentProxy, extractText } = await import("unpdf");
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (text || "").replace(/\s+/g, " ").trim();
}

export async function extractTextFromDocxInBrowser(file: File): Promise<string> {
  if (typeof window === "undefined") throw new Error("extractTextFromDocxInBrowser must run in the browser.");
  const mammoth = (await import("mammoth")).default;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = (result?.value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return html;
}

export async function extractTextFromFileInBrowser(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractTextFromPdfInBrowser(file);
  }
  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDocxInBrowser(file);
  }
  throw new Error("Unsupported format. Use PDF or DOCX.");
}
