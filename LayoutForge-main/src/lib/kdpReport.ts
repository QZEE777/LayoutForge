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
    fontUsed: "Times New Roman",
    trimSize: options.trimSize,
    gutterInches: options.gutterInches,
    outputType: "docx",
    status: "Review Draft ✓",
    formatReviewText: options.formatReviewText,
  };
}
