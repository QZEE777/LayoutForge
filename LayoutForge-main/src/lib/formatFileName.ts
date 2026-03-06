const MAX_DISPLAY_CHARS = 40;

/**
 * Sanitize a book title (or any string) for use as a filename: lowercase, spaces to hyphens, special chars removed.
 * E.g. "Primal Balance Book" → "primal-balance-book"
 * If the result is empty, returns a default base (no extension).
 */
export function sanitizeFilenameFromTitle(title: string): string {
  if (typeof title !== "string" || !title.trim()) return "";
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "";
}

/**
 * Return a safe output filename from a title and extension (e.g. ".pdf", ".docx", ".epub").
 * Uses sanitizeFilenameFromTitle; if empty, falls back to "document" + ext.
 */
export function outputFilenameFromTitle(title: string, ext: string): string {
  const base = sanitizeFilenameFromTitle(title);
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  return (base || "document") + safeExt;
}

/**
 * Return a safe output filename from an original filename (e.g. "My Book.pdf"): strip extension, sanitize, add new extension.
 */
export function outputFilenameFromOriginal(originalName: string, newExt: string): string {
  const base = originalName.replace(/\.[^.]+$/, "").trim();
  const sanitized = sanitizeFilenameFromTitle(base);
  const safeExt = newExt.startsWith(".") ? newExt : `.${newExt}`;
  return (sanitized || "document") + safeExt;
}

/**
 * Truncate filename to max length with ellipsis in the middle, preserving extension.
 * E.g. "Feasibility_Study_and_Go-to_Bee_Swarms (1).pdf" → "Feasibility_Study_...Bee_Swarms (1).pdf"
 */
export function truncateFilenameMiddle(name: string, maxLen: number = MAX_DISPLAY_CHARS): string {
  if (name.length <= maxLen) return name;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const endPartLen = Math.min(12 + ext.length, name.length);
  const endPart = name.slice(-endPartLen);
  const startLen = maxLen - 3 - endPart.length;
  if (startLen <= 0) return name.slice(0, maxLen - 3) + "..." + ext;
  const startPart = name.slice(0, startLen);
  return startPart + "..." + endPart;
}

export function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(2)} MB`;
}
