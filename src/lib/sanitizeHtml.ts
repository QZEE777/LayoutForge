/**
 * Sanitize HTML for safe display (e.g. AI-generated book descriptions).
 * Allowlist: p, b, i, br, strong, em, ul, ol, li. Strip all other tags and all attributes.
 */

const ALLOWED = new Set(["p", "b", "i", "br", "strong", "em", "ul", "ol", "li"]);

export function sanitizeHtml(html: string): string {
  if (typeof html !== "string" || !html.trim()) return "";
  const maxLen = 50000;
  let s = html.length > maxLen ? html.slice(0, maxLen) : html;

  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\s*[^>]*>/g, (full, tagName) => {
    const lower = tagName.toLowerCase();
    if (!ALLOWED.has(lower)) return "";
    if (full.startsWith("</")) return `</${lower}>`;
    return `<${lower}>`;
  });

  return s;
}
