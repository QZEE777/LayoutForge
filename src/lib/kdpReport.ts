/**
 * KDP formatter report types and builder.
 * Used by the preview (DOCX) and PDF routes to store and return processing results.
 */

import type { TrimSizeId } from "./kdpConfig";

export interface KdpProcessingReport {
  pagesGenerated: number;
  chaptersDetected: number;
  sectionsDetected: number;
  lessonsDetected: number;
  estimatedPages: number;
  issues: string[];
  fontUsed: string;
  trimSize: TrimSizeId;
  gutterInches: number;
  outputType: "docx" | "pdf";
  status: string;
  formatReviewText?: string;
}

/**
 * Build a short compliance report text to prepend as the first page in the surgical DOCX output.
 */
export function buildComplianceReportText(options: {
  bookTitle: string;
  trimSize: string;
  estimatedPages: number;
  chaptersDetected: number;
  issues: string[];
}): string {
  const lines: string[] = [
    "KDP Compliance Report",
    "",
    `Title: ${options.bookTitle}`,
    `Trim: ${options.trimSize}`,
    `Estimated pages: ${options.estimatedPages}`,
    `Chapters: ${options.chaptersDetected}`,
    "",
    options.issues.length > 0 ? "Issues:" : "Issues: None",
    ...options.issues.map((i) => `  • ${i}`),
  ];
  return lines.join("\n");
}

/**
 * Build a report for DOCX preview (no page count from render).
 */
export function buildDocxPreviewReport(options: {
  chaptersDetected: number;
  sectionsDetected: number;
  lessonsDetected: number;
  estimatedPages: number;
  issues: string[];
  trimSize: TrimSizeId;
  gutterInches: number;
  formatReviewText: string;
}): KdpProcessingReport {
  return {
    pagesGenerated: 0,
    chaptersDetected: options.chaptersDetected,
    sectionsDetected: options.sectionsDetected,
    lessonsDetected: options.lessonsDetected,
    estimatedPages: options.estimatedPages,
    issues: options.issues,
    fontUsed: "Original fonts preserved",
    trimSize: options.trimSize,
    gutterInches: options.gutterInches,
    outputType: "docx",
    status: "Review Draft ✓",
    formatReviewText: options.formatReviewText,
  };
}
