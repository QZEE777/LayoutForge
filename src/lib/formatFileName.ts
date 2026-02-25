const MAX_DISPLAY_CHARS = 40;

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
