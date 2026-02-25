import JSZip from "jszip";

/**
 * Extract text from a PDF buffer using pdf-parse (server-side fallback when CloudConvert TXT is empty).
 */
export async function extractTextFromPDFBuffer(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return typeof data?.text === "string" ? data.text : "";
}

/**
 * Extract raw text from a DOCX buffer (zip with word/document.xml). Used when PDF→TXT and pdf-parse both fail.
 */
export async function extractTextFromDocxBuffer(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) return "";

  // Extract text from <w:t> elements (OOXML body text). Handle namespaced tags.
  const matches = docXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
  if (!matches) return "";

  const parts = matches.map((m) => {
    const inner = m.replace(/<w:t[^>]*>/, "").replace(/<\/w:t>/, "");
    return decodeXmlEntities(inner);
  });
  return parts.join(" ");
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}
