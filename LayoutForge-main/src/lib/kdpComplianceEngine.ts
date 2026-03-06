/**
 * KDP compliance checks for parsed manuscript content.
 * Returns a list of human-readable issues; does not modify content.
 */

const KDP_MIN_PAGES = 24;
const KDP_MAX_PAGES = 828;

export interface ComplianceInput {
  estimatedPageCount: number;
  chaptersCount: number;
  hasPreChapterContent: boolean;
  totalParagraphs: number;
}

/**
 * Run KDP rule checks and return issue messages.
 */
export function runKdpCompliance(input: ComplianceInput): string[] {
  const issues: string[] = [];

  if (input.estimatedPageCount < KDP_MIN_PAGES) {
    issues.push(`Document is under ${KDP_MIN_PAGES} pages; KDP requires a minimum page count.`);
  }
  if (input.estimatedPageCount > KDP_MAX_PAGES) {
    issues.push(`Document exceeds ${KDP_MAX_PAGES} pages; KDP maximum for most trim sizes.`);
  }
  if (input.chaptersCount === 0 && input.totalParagraphs > 0) {
    issues.push(
      "No chapters detected. Add Word Heading 1 (or lines like 'CHAPTER 1') for proper structure."
    );
  }
  if (input.chaptersCount > 0 && input.totalParagraphs === 0) {
    issues.push(
      "Chapters detected but no body paragraphs. Check that content is not in headers/footers or text boxes."
    );
  }

  return issues;
}
