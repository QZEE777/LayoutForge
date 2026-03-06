/**
 * Platform hub data: tools and platforms. Used by homepage and /platform/[id] page.
 */

const PAID_PRICING = "$7 per use · $27 for 6 months";

export interface Tool {
  id: string;
  title: string;
  description: string;
  href: string;
  available: boolean;
  iconPath: string;
  free?: boolean;
  /** Shown on paid tool cards (e.g. "$7 per use · $27 for 6 months"). Omit for free tools. */
  pricing?: string;
}

export const ALL_TOOLS: Tool[] = [
  { id: "kdp-formatter", title: "KDP Formatter (DOCX)", description: "Format DOCX for Amazon KDP print. Trim size, bleed, print-ready PDF.", href: "/kdp-formatter", available: true, iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", pricing: PAID_PRICING },
  { id: "keyword-research", title: "7 Keyword Research (DOCX)", description: "Get 7 KDP keyword phrases from your DOCX manuscript.", href: "/keyword-research", available: true, iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7", pricing: PAID_PRICING },
  { id: "description-generator", title: "Description Generator (DOCX)", description: "DOCX only. Full Amazon listing — book description, author bio, BISAC categories.", href: "/description-generator", available: true, iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", pricing: PAID_PRICING },
  { id: "pdf-compress", title: "PDF Compressor", description: "Shrink PDFs up to 50MB. No account needed.", href: "/pdf-compress", available: true, iconPath: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4", free: true },
  { id: "pdf-optimizer", title: "PDF Print Optimizer", description: "Shrink / print-optimize your PDF.", href: "/kdp-formatter-pdf", available: true, iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", free: true },
  { id: "kdp-pdf-checker", title: "KDP PDF Checker", description: "Check your PDF against KDP specs.", href: "/kdp-pdf-checker", available: true, iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", pricing: PAID_PRICING },
  { id: "kdp-format-review", title: "KDP Format Review", description: "AI format review: KDP Readiness + top fixes. Paste or upload DOCX/PDF.", href: "/kdp-format-review", available: true, iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", pricing: PAID_PRICING },
  { id: "keyword-research-pdf", title: "7 Keyword Research (PDF)", description: "Get 7 KDP keyword phrases from your PDF.", href: "/keyword-research-pdf", available: true, iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7", pricing: PAID_PRICING },
  { id: "description-generator-pdf", title: "Description Generator (PDF)", description: "PDF only. Full Amazon listing — book description, author bio, BISAC categories.", href: "/description-generator-pdf", available: true, iconPath: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", pricing: PAID_PRICING },
  { id: "market-analysis", title: "Market Analysis", description: "AI analyzes competitor books to determine your key selling points and differentiation.", href: "/market-analysis", available: false, iconPath: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", pricing: PAID_PRICING },
  { id: "epub-maker", title: "Kindle EPUB Maker", description: "Manuscript to Kindle-ready EPUB.", href: "/epub-maker", available: true, iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", pricing: PAID_PRICING },
  { id: "royalty-calculator", title: "KDP Royalty Calculator", description: "Earnings by page count, trim, list price.", href: "/royalty-calculator", available: true, iconPath: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z", free: true },
  { id: "page-count-estimator", title: "Page Count Estimator", description: "Estimate interior pages from word count and trim size.", href: "/page-count-estimator", available: true, iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4H5m3-4H5m0 0h3", free: true },
  { id: "trim-size-comparison", title: "Trim Size Comparison", description: "Compare print cost and royalty across trim sizes.", href: "/trim-size-comparison", available: true, iconPath: "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z", free: true },
  { id: "spine-calculator", title: "Spine width calculator", description: "Spine width and full-wrap cover dimensions for KDP paperbacks.", href: "/spine-calculator", available: true, iconPath: "M4 6h16M4 10h16M4 14h16M4 18h16", free: true },
  { id: "cover-calculator", title: "Full-wrap cover calculator", description: "Cover canvas size in inches and pixels (300 DPI) for Canva and design tools.", href: "/cover-calculator", available: true, iconPath: "M3 6h18v12H3V6z", free: true },
  { id: "interior-template", title: "KDP interior template", description: "Download a PDF with your book's exact trim + safe zone (margins & gutter) for Canva.", href: "/interior-template", available: true, iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", free: true },
  { id: "banned-keyword-checker", title: "Banned keyword checker", description: "Spot risky words in title, subtitle, or description before publishing.", href: "/banned-keyword-checker", available: true, iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", free: true },
  { id: "kids-trim-guide", title: "Kids book trim guide", description: "Trim sizes and page counts for picture books and children's titles.", href: "/kids-trim-guide", available: true, iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", free: true },
  { id: "journals-coloring-puzzle-guide", title: "Journals, coloring & puzzle guide", description: "Trim sizes, page counts, and KDP tips for journals, workbooks, coloring books, and puzzle/activity books.", href: "/journals-coloring-puzzle-guide", available: true, iconPath: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", free: true },
];

export interface Platform {
  id: string;
  name: string;
  tagline: string;
  toolIds: string[];
}

export const PLATFORMS: Platform[] = [
  { id: "kdp", name: "Amazon KDP", tagline: "Everything you need for Amazon KDP", toolIds: ["pdf-compress", "pdf-optimizer", "royalty-calculator", "page-count-estimator", "trim-size-comparison", "spine-calculator", "cover-calculator", "interior-template", "banned-keyword-checker", "kids-trim-guide", "journals-coloring-puzzle-guide", "kdp-formatter", "keyword-research", "description-generator", "kdp-pdf-checker", "kdp-format-review", "keyword-research-pdf", "description-generator-pdf", "market-analysis", "epub-maker"] },
];

/**
 * Archived platforms (not used in the current KDP/Kindle-only build).
 *
 * Keep these definitions here so they can be re-attached later if manu2print
 * expands beyond Amazon again.
 */
export const ARCHIVED_PLATFORMS: Platform[] = [
  { id: "ingramspark", name: "IngramSpark", tagline: "Everything you need for IngramSpark", toolIds: [] },
  { id: "gumroad", name: "Gumroad", tagline: "Everything you need for Gumroad", toolIds: [] },
];

export function getToolsForPlatform(toolIds: string[]): Tool[] {
  return toolIds.map((id) => ALL_TOOLS.find((t) => t.id === id)).filter(Boolean) as Tool[];
}
