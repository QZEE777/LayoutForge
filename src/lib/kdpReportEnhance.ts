/**
 * KDP compliance report enhancements:
 * score/grade, tool-specific fix instructions, human-readable text,
 * fix difficulty labels, upload checklist, spec table.
 */

import {
  getGutterInches,
  MIN_SPINE_TEXT_PAGES,
  HARDCOVER_MIN_PAGES,
  HARDCOVER_MAX_PAGES,
  HARDCOVER_TRIM_SIZES,
  PAPERBACK_MAX_PAGES,
} from "./kdpConfig";

export type FixDifficulty = "easy" | "moderate" | "advanced";

export interface EnrichedIssue {
  originalMessage: string;
  humanMessage: string;
  toolFixInstruction: string;     // Tool-specific step-by-step fix
  fixDifficulty: FixDifficulty;
  page?: number;
  rule_id?: string;
  severity?: string;
}

export interface ChecklistItem {
  check: string;
  status: "pass" | "warning" | "fail";
}

export interface SpecRow {
  requirement: string;
  yourFile: string;
  kdpRequired: string;
  status: "pass" | "warning" | "fail";
}

export interface ScoreGrade {
  grade: string;         // A+, A, B, C, D, F
  label: string;         // "KDP Ready", "Nearly Ready", etc.
  description: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE GRADE BANDS
// ─────────────────────────────────────────────────────────────────────────────

export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 95) return { grade: "A+", label: "KDP Ready",        description: "Your PDF meets all KDP requirements. Safe to upload." };
  if (score >= 85) return { grade: "A",  label: "Ready",            description: "Minor issues found. Fix warnings for best print quality." };
  if (score >= 70) return { grade: "B",  label: "Nearly Ready",     description: "A few issues to fix before uploading to KDP." };
  if (score >= 50) return { grade: "C",  label: "Needs Work",       description: "Multiple issues detected. Fix all errors before submitting." };
  if (score >= 25) return { grade: "D",  label: "Major Issues",     description: "Serious problems found. KDP will likely reject this file." };
  return              { grade: "F",  label: "Will Be Rejected", description: "Critical issues detected. This file will be rejected by KDP." };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOOL-SPECIFIC FIX INSTRUCTIONS
// Maps rule_id → { toolKey → exact steps }
// ─────────────────────────────────────────────────────────────────────────────

const TOOL_FIX_MAP: Record<string, Record<string, string>> = {
  EMBEDDED_FONTS: {
    microsoft_word:    "File → Export → Create PDF/XPS → Options → check 'ISO 19005-1 compliant (PDF/A)' OR check 'Embed fonts in the file' under Save options.",
    adobe_indesign:    "File → Export → Adobe PDF → Advanced tab → Fonts: set 'Subset fonts when percent of characters used' to 100%.",
    affinity_publisher:"File → Export → PDF → More... → Compatibility: set to PDF 1.4+, check 'Embed Fonts'.",
    canva:             "Canva does not reliably embed all fonts. Download as PDF (Print) not PDF (Standard). For guaranteed embedding, re-create in Affinity Publisher or InDesign.",
    vellum:            "Vellum always embeds fonts on export. If you see this error, re-export: File → Generate → KDP Print → re-download the PDF.",
    scrivener:         "File → Compile → PDF Settings → check 'Embed fonts'. If unavailable, compile to DOCX then export to PDF from Word with embedding enabled.",
    libreoffice:       "File → Export as PDF → General tab → check 'Embed standard fonts' and 'Embed fonts in the document'.",
    apple_pages:       "File → Export To → PDF → Image Quality: Best → tick 'Create PDF/A file'. On older Pages: File → Print → Save as PDF (this embeds fonts).",
    latex:             "Add \\usepackage[T1]{fontenc} and ensure you compile with pdflatex or xelatex. Avoid Type3 bitmap fonts; use scalable font packages.",
    unknown:           "Re-export your PDF with 'Embed all fonts' enabled. In your layout software, look for PDF export settings and check 'Embed fonts' or 'PDF/A' compliance.",
  },
  TRANSPARENCY_FLATTENING: {
    microsoft_word:    "Word PDFs rarely have transparency issues. If you used inserted images with effects: select each image → Format → Remove Background or Remove Effects, then re-export.",
    adobe_indesign:    "File → Export → Adobe PDF → Advanced → Transparency Flattener: set to 'High Resolution'. Or export as PDF/X-1a which flattens automatically.",
    affinity_publisher:"File → Export → PDF → More... → set 'Rasterise' to 'Nothing' and 'Flatten' to 'All layers'. Use PDF/X-1a for guaranteed flattening.",
    canva:             "Export as 'PDF Print' (NOT 'PDF Standard'). Canva's Print PDF flattens most transparency. Alternatively, download PNG pages and re-assemble in another tool.",
    vellum:            "Vellum does not use transparency. If you imported images with transparency (PNG with alpha): replace them with JPEG or flattened PNG versions.",
    scrivener:         "Scrivener text PDFs don't use transparency. If you have images with effects, pre-flatten them in Photoshop (Layer → Flatten Image) before importing.",
    affinity_photo:    "Layer → Flatten Document, then File → Export → PDF with PDF/X-1a preset.",
    unknown:           "Flatten all transparency before export. In Adobe products: use 'Flatten Transparency' or export as PDF/X-1a. In Canva: use 'PDF Print'. Remove drop shadows, opacity effects, and blend modes.",
  },
  INTERACTIVE_ELEMENTS: {
    microsoft_word:    "Remove all form fields: Developer tab → remove content controls. Then re-export as PDF (not 'Save as PDF with form fields').",
    adobe_indesign:    "Window → Interactive → remove all form objects. Export as PDF Print (not Interactive PDF).",
    adobe_acrobat:     "Tools → Forms → Edit → select all form fields → Delete. Then re-save the PDF.",
    unknown:           "Remove all interactive form fields, buttons, and widgets. Open in Adobe Acrobat Pro → Tools → Forms → Edit → select all → delete. Re-save as a standard print PDF.",
  },
  GUTTER_MARGIN: {
    microsoft_word:    "Layout → Margins → Custom Margins → set 'Inside' margin to the required value. Ensure 'Mirror Margins' is checked so the gutter alternates sides correctly.",
    adobe_indesign:    "File → Document Setup → Margins: set 'Inside' (gutter) to required value. Ensure 'Facing Pages' is enabled.",
    affinity_publisher:"File → Document Setup → Margins: increase Inside margin. Enable 'Facing pages spread'.",
    canva:             "Canva does not support mirror margins. For a multi-page book with proper gutters, use a dedicated tool like Affinity Publisher, InDesign, or Vellum.",
    vellum:            "Book Settings → Trim → adjust Gutter. Note: Vellum auto-calculates gutters based on KDP rules when you select your trim size.",
    unknown:           "Increase the inside (gutter) margin. For KDP: ≤150 pages = 0.375\", 151–300 = 0.5\", 301–500 = 0.625\", 501–700 = 0.75\", 701+ = 0.875\". Enable mirror margins so the gutter is on the correct side for each page.",
  },
  IMAGE_RESOLUTION: {
    microsoft_word:    "Word compresses images on export. File → Options → Advanced → Image Size and Quality → uncheck 'Compress images in file' AND 'Do not compress images in file'. Set default resolution to 330 PPI.",
    adobe_indesign:    "Links panel: check all images show 300+ PPI effective resolution. For low-res images: replace the source file with a higher resolution version.",
    canva:             "Canva limits image resolution. For print: use Canva Pro which exports at 300 DPI, or replace low-res photos with higher resolution versions before exporting.",
    unknown:           "Replace any low-resolution images with 300 DPI (or 1200 DPI for line art) versions at their placed size. The DPI displayed is the effective resolution — a 300 DPI source image scaled up to 200% is only 150 DPI effective.",
  },
  BLEED_VALIDATION: {
    microsoft_word:    "Word does not support bleed. For full-bleed books, use InDesign or Affinity Publisher. Alternatively, remove all edge-to-edge images and keep content within margins.",
    adobe_indesign:    "File → Document Setup → Bleed: set all sides to 0.125\". Extend all edge images and backgrounds to the bleed guides (red lines). Re-export with bleed included.",
    affinity_publisher:"File → Document Setup → Bleed: 0.125\" all sides. Drag image edges to the red bleed guides. Export → Include Bleed.",
    canva:             "Enable bleed in Canva: Resize → use a custom size 0.25\" larger than your trim in each dimension. Export PDF (Print) → check 'Crop marks and bleed'.",
    unknown:           "Set 0.125\" bleed in your document setup and extend all edge images and backgrounds beyond the trim line. Your PDF page must be 0.25\" wider and taller than your trim size when bleed is used.",
  },
  ALLOWED_TRIM_SIZES: {
    microsoft_word:    "Layout → Size → More Paper Sizes → set Width and Height to your trim size exactly (e.g. 6\" × 9\"). Then File → Export → Create PDF/XPS.",
    adobe_indesign:    "File → Document Setup → Intent: Print → set Width and Height to your KDP trim size. Re-export.",
    affinity_publisher:"File → Document Setup → set Page dimensions to your KDP trim size exactly.",
    vellum:            "Book Settings → Trim Size → select your size. Vellum will automatically set the correct dimensions.",
    canva:             "Create a new design → Custom Size → enter your trim dimensions exactly in inches.",
    unknown:           "Supported KDP paperback trim sizes (16 total): 5×8\", 5.06×7.81\", 5.25×8\", 5.5×8\", 5.5×8.5\", 6×9\", 6.14×9.21\", 6.69×9.61\", 7×10\", 7.44×9.69\", 7.5×9.25\", 8×10\", 8.25×6\", 8.25×8.25\", 8.5×8.5\", 8.5×11\". Hardcover sizes differ — see KDP help. Set your document to exactly one of these sizes and re-export.",
  },
  LINE_WEIGHT: {
    adobe_indesign:    "Select the rule or line → Stroke panel → set Weight to at least 0.75pt. Lines thinner than 0.75pt may not print reliably on KDP's offset presses.",
    affinity_publisher:"Select the shape or line → Stroke panel → increase Width to 0.75pt minimum.",
    adobe_illustrator: "Select the path → Stroke panel → set Weight to at least 0.75pt before embedding in your layout.",
    canva:             "Select the line element → adjust the border or line thickness to at least 1pt (Canva uses whole points). Sub-1pt lines do not print reliably in print PDFs.",
    unknown:           "Any rule, border, or decorative line thinner than 0.75pt may drop out or print unevenly on KDP's offset presses. Increase all rule weights to 0.75pt or thicker.",
  },
  IMAGE_COLOR_MODE: {
    adobe_indesign:    "Edit → Convert to Profile → set destination to 'U.S. Web Coated (SWOP) v2' CMYK. For spot colors: Window → Swatches → select spot colors → Convert to Process.",
    affinity_publisher:"Document → Convert to Color Profile → choose 'CMYK'. For spot colors: Swatches panel → convert to CMYK process.",
    adobe_photoshop:   "Image → Mode → CMYK Color. Flatten layers. Save as TIFF or EPS (not JPEG for CMYK). Re-link in your layout software.",
    unknown:           "Convert all spot colors (Pantone, Separation, DeviceN) to CMYK process colors. KDP does not support spot colors. In Photoshop: Image → Mode → CMYK. In Illustrator: Edit → Convert to CMYK.",
  },
  ODD_PAGE_COUNT: {
    microsoft_word:    "Add a blank page at the end: position cursor after last page → Insert → Page Break. Verify total page count is even before exporting.",
    adobe_indesign:    "Pages panel → right-click after last page → Insert Pages → add 1 blank page at end.",
    affinity_publisher:"Pages panel → right-click → Insert Page → add 1 blank page at end.",
    vellum:            "Vellum handles this automatically on export. No action needed.",
    unknown:           "Add one blank page to the end of your document to make the total page count even. KDP prints in pairs (front and back) — an odd page count causes KDP to add a blank page automatically which can shift page numbering.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RULE_ID → FIX DIFFICULTY
// ─────────────────────────────────────────────────────────────────────────────

const RULE_DIFFICULTY: Record<string, FixDifficulty> = {
  // Easy — just a settings change
  MIN_PAGE_COUNT:          "easy",
  MAX_PAGE_COUNT:          "easy",
  ODD_PAGE_COUNT:          "easy",
  CONSISTENT_TRIM:         "easy",
  ALLOWED_TRIM_SIZES:      "easy",
  MIXED_PAGE_SIZES:        "easy",
  PDF_VERSION:             "easy",
  ORIENTATION_CONSISTENCY: "easy",
  ROTATED_PAGES:           "easy",
  EMPTY_PAGE:              "easy",
  TOP_MARGIN_MIN:          "easy",
  BOTTOM_MARGIN_MIN:       "easy",
  OUTSIDE_MARGIN_MIN:      "easy",
  GUTTER_MARGIN:           "easy",
  TEXT_OUTSIDE_TRIM:       "easy",
  SAFE_ZONE:               "easy",
  // Moderate — needs layout adjustment
  BLEED_VALIDATION:        "moderate",
  IMAGE_BLEED:             "moderate",
  TRIM_BOX:                "moderate",
  KDP_TRIM_PROFILE:        "moderate",
  IMAGE_PLACEMENT:         "moderate",
  // Advanced — requires tools knowledge / asset changes
  EMBEDDED_FONTS:          "advanced",
  TRANSPARENCY_FLATTENING: "advanced",
  INTERACTIVE_ELEMENTS:    "advanced",
  IMAGE_RESOLUTION:        "advanced",
  IMAGE_COLOR_MODE:        "advanced",
  MIN_FONT_SIZE:           "moderate",
  RESTRICTED_FONT_EMBEDDING: "moderate",
  // Sprint 1 additions
  LINE_WEIGHT:             "easy",
  HARDCOVER_PAGE_MIN:      "easy",
  HARDCOVER_PAGE_MAX:      "easy",
  HARDCOVER_TRIM_SIZE:     "easy",
  SPINE_TEXT_WARNING:      "easy",
  GUTTER_BOUNDARY_WARNING: "easy",
};

const EASY_KEYWORDS     = ["margin", "metadata", "gutter", "inner margin", "outer margin", "trim size", "page size", "rotation", "orientation"];
const MODERATE_KEYWORDS = ["bleed", "crop", "safe area", "trim box"];
const ADVANCED_KEYWORDS = ["font", "embed", "layout", "color", "resolution", "image", "raster", "transparency", "interactive", "spot color", "widget"];

export function toFixDifficulty(ruleId: string, message: string): FixDifficulty {
  const r = ruleId.toUpperCase().trim();
  if (RULE_DIFFICULTY[r]) return RULE_DIFFICULTY[r];
  if (r === "EMPTY_PAGE") return "easy";
  const combined = `${r} ${message}`.toLowerCase();
  if (ADVANCED_KEYWORDS.some((k) => combined.includes(k))) return "advanced";
  if (MODERATE_KEYWORDS.some((k) => combined.includes(k))) return "moderate";
  if (EASY_KEYWORDS.some((k)    => combined.includes(k))) return "easy";
  return "moderate";
}

// ─────────────────────────────────────────────────────────────────────────────
// HUMAN-READABLE MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

const HUMAN_MAP: Array<{ pattern: RegExp; rule_ids?: string[]; human: string }> = [
  {
    rule_ids: ["EMBEDDED_FONTS"],
    pattern: /font.*not embedded|not embedded/i,
    human: "One or more fonts are NOT embedded in your PDF. KDP automatically rejects files with unembedded fonts — this is the #1 cause of KDP upload failures.",
  },
  {
    rule_ids: ["TRANSPARENCY_FLATTENING"],
    pattern: /transparency|unflattened/i,
    human: "Unflattened transparency detected. This causes white boxes, missing content, or incorrect print rendering at KDP. Must be fixed before uploading.",
  },
  {
    rule_ids: ["INTERACTIVE_ELEMENTS"],
    pattern: /interactive|form field|widget/i,
    human: "Interactive form fields or widgets were found. KDP is a print service — these elements must be removed or flattened before uploading.",
  },
  {
    rule_ids: ["GUTTER_MARGIN"],
    pattern: /gutter|inside.*margin|inner.*margin/i,
    human: "Text is too close to the inside (spine) edge. This text will disappear into the binding. Increase the inside margin based on your page count.",
  },
  {
    rule_ids: ["IMAGE_RESOLUTION"],
    pattern: /resolution|dpi|line art.*1200/i,
    human: "One or more images are below the minimum DPI. Photos need 300 DPI; line art (black & white drawings) needs 1200 DPI. These will look blurry or pixelated in print.",
  },
  {
    rule_ids: ["IMAGE_COLOR_MODE"],
    pattern: /spot color|devicen|separation/i,
    human: "Spot colors (Pantone/Separation/DeviceN) detected. KDP only prints CMYK process colors — spot colors must be converted or your book will not print correctly.",
  },
  {
    rule_ids: ["BLEED_VALIDATION", "IMAGE_BLEED"],
    pattern: /bleed|trim.*outside|does not extend/i,
    human: "Content reaches the trim edge but doesn't extend into the bleed area. After trimming, a white gap will appear at the edge. Extend backgrounds and images 0.125\" past the trim line.",
  },
  {
    rule_ids: ["ALLOWED_TRIM_SIZES"],
    pattern: /trim size|not a kdp|page size|not supported/i,
    human: "Your PDF page dimensions don't match any KDP-supported trim size. Common sizes: 5×8\", 5.5×8.5\", 6×9\", 7×10\", 8.5×11\". Your PDF must match your KDP setup exactly.",
  },
  {
    rule_ids: ["CONSISTENT_TRIM", "MIXED_PAGE_SIZES"],
    pattern: /differ from first page|mixed.*size|inconsistent/i,
    human: "Not all pages are the same size. KDP requires every page to have identical dimensions. Check for accidentally resized pages in your layout software.",
  },
  {
    rule_ids: ["ODD_PAGE_COUNT"],
    pattern: /odd.*page|page count.*odd|even/i,
    human: "Your book has an odd number of pages. KDP prints in pairs — it will automatically add a blank page at the end, which may shift page numbers. Add a blank final page yourself to control this.",
  },
  {
    rule_ids: ["MIN_PAGE_COUNT"],
    pattern: /minimum.*24|below.*24|fewer than 24/i,
    human: "Your PDF has fewer than 24 pages. KDP requires a minimum of 24 pages for all print books. Add front matter, blank pages, or additional content to reach 24 pages.",
  },
  {
    rule_ids: ["MAX_PAGE_COUNT"],
    pattern: /maximum|exceeds.*828|exceeds.*550|hardcover/i,
    human: "Your PDF exceeds KDP's page limit. Paperbacks: max 828 pages. Hardcovers: max 550 pages. Reduce content or split into multiple volumes.",
  },
  {
    rule_ids: ["TOP_MARGIN_MIN", "BOTTOM_MARGIN_MIN", "OUTSIDE_MARGIN_MIN", "SAFE_ZONE"],
    pattern: /margin|safe zone|extends.*above|extends.*below|outside margin/i,
    human: "Content is too close to the page edge and may be cut off during printing. KDP requires at least 0.25\" on top, bottom, and outside edges (plus gutter on the inside).",
  },
  {
    rule_ids: ["IMAGE_RESOLUTION"],
    pattern: /image.*below|resolution.*below/i,
    human: "An image doesn't meet KDP's minimum resolution. Photos require 300 DPI; black & white line drawings require 1200 DPI at their final printed size.",
  },
  {
    pattern: /rotated|rotation/i,
    human: "One or more pages have a PDF rotation applied. KDP does not support page rotation — remove the rotation in your software and re-export.",
  },
  {
    pattern: /orientation/i,
    human: "Mixed page orientations detected. All pages must be either portrait or landscape — not both.",
  },
  {
    pattern: /pdf version|version.*below/i,
    human: "Your PDF version is below the minimum required. Re-export using PDF 1.3 or higher (PDF 1.4 or 1.5 recommended for best compatibility).",
  },
  // ── Sprint 1 additions ────────────────────────────────────────────────────
  {
    rule_ids: ["LINE_WEIGHT"],
    pattern: /line.*weight|stroke.*width|thin.*rule|rule.*thin|hairline/i,
    human: "One or more rules or borders are thinner than 0.75pt. Lines this thin may drop out entirely or print unevenly on KDP's offset presses. Increase all decorative lines and borders to at least 0.75pt.",
  },
  {
    rule_ids: ["HARDCOVER_PAGE_MIN"],
    pattern: /hardcover.*minimum|minimum.*hardcover|fewer.*75|75.*pages.*hardcover/i,
    human: "KDP hardcover books require a minimum of 75 pages. Your file is below this threshold. Add front matter, a blank page, or additional content to reach 75 pages.",
  },
  {
    rule_ids: ["HARDCOVER_PAGE_MAX"],
    pattern: /hardcover.*maximum|maximum.*hardcover|exceeds.*550|550.*hardcover/i,
    human: "KDP hardcover books have a 550-page maximum. Your file exceeds this limit. Reduce content or consider splitting into multiple volumes.",
  },
  {
    rule_ids: ["HARDCOVER_TRIM_SIZE"],
    pattern: /hardcover.*trim|trim.*hardcover|hardcover.*size/i,
    human: "Your trim size is not on KDP's supported hardcover list. Hardcovers support fewer sizes than paperbacks — supported sizes include 5.5×8.5\", 6×9\", 6.14×9.21\", 6.69×9.61\", 7×10\", 7.44×9.69\", 7.5×9.25\", 8.5×11\".",
  },
  {
    rule_ids: ["SPINE_TEXT_WARNING"],
    pattern: /spine.*text|text.*spine|spine.*narrow/i,
    human: "Your page count is below 80 pages, which means the spine is too narrow for title or author text. Leave the spine blank on your cover design — KDP will reject cover files that include spine text on books this thin.",
  },
  {
    rule_ids: ["GUTTER_BOUNDARY_WARNING"],
    pattern: /gutter.*boundary|boundary.*gutter|near.*gutter.*threshold|gutter.*threshold/i,
    human: "Your page count is within 5 pages of a KDP gutter margin threshold. Adding or removing a few pages will change the required inside margin. Verify your gutter setting matches the final page count before uploading.",
  },
];

function toHumanMessage(message: string, ruleId?: string): string {
  // First: try exact rule_id match for highest specificity
  if (ruleId) {
    for (const { rule_ids, pattern, human } of HUMAN_MAP) {
      if (rule_ids?.includes(ruleId.toUpperCase()) && pattern.test(message)) return human;
    }
    // rule_id match without pattern
    for (const { rule_ids, human } of HUMAN_MAP) {
      if (rule_ids?.includes(ruleId.toUpperCase())) return human;
    }
  }
  // Fallback: pattern match on message
  for (const { pattern, human } of HUMAN_MAP) {
    if (pattern.test(message)) return human;
  }
  return `${message} Fix this issue before uploading to KDP.`;
}

/**
 * Get the best tool-specific fix instruction for a rule and creation tool.
 * Falls back to 'unknown' if the specific tool isn't mapped.
 */
export function getToolFixInstruction(ruleId: string, creationTool: string): string {
  const ruleMap = TOOL_FIX_MAP[ruleId?.toUpperCase()];
  if (!ruleMap) return "";
  return ruleMap[creationTool] ?? ruleMap["unknown"] ?? "";
}

/** Clean filename for display: underscores → spaces, title case, remove .pdf */
export function cleanFilenameForDisplay(filename: string): string {
  if (!filename || typeof filename !== "string") return "— PDF";
  let base = filename.replace(/_/g, " ").trim();
  const ext = base.toLowerCase().endsWith(".pdf") ? base.slice(-4) : "";
  if (ext) base = base.slice(0, -4).trim();
  const titleCase = base.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return titleCase ? `${titleCase} — PDF` : "— PDF";
}

export function enrichIssue(
  message: string,
  page: number | undefined,
  rule_id: string,
  severity: string,
  creationTool = "unknown",
): EnrichedIssue {
  return {
    originalMessage: message,
    humanMessage:    toHumanMessage(message, rule_id),
    toolFixInstruction: getToolFixInstruction(rule_id, creationTool),
    fixDifficulty:   toFixDifficulty(rule_id, message),
    page,
    rule_id,
    severity,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORING (use engine score when available; fall back to local)
// ─────────────────────────────────────────────────────────────────────────────

/** 0 issues = 97. Auto-reject rules (unembedded fonts, transparency) = -25. Others = -12 per error, -3 per warning. */
export function computeKdpPassProbability(errorCount: number, warningCount: number): number {
  let score = 97;
  score -= errorCount * 12;
  score -= warningCount * 3;
  return Math.max(0, Math.min(97, score));
}

/** Readiness score out of 100. */
export function computeReadinessScore100(errorCount: number, warningCount: number): number {
  return computeKdpPassProbability(errorCount, warningCount);
}

/** Top 3–5 pages with the most issues (errors weighted more). */
export function getHighRiskPageNumbers(
  pageIssues: Array<{ page: number; severity?: string }> | undefined
): number[] {
  if (!pageIssues?.length) return [];
  const byPage = new Map<number, { errors: number; warnings: number }>();
  for (const i of pageIssues) {
    const p = i.page;
    const sev = ((i.severity ?? "error")).toLowerCase();
    const isError = sev === "error" || sev === "critical" || sev === "advanced";
    if (!byPage.has(p)) byPage.set(p, { errors: 0, warnings: 0 });
    const cur = byPage.get(p)!;
    if (isError) cur.errors += 1;
    else cur.warnings += 1;
  }
  return [...byPage.entries()]
    .map(([page, counts]) => ({ page, weight: counts.errors * 10 + counts.warnings }))
    .filter((x) => x.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((x) => x.page)
    .sort((a, b) => a - b);
}

export function getRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score >= 85) return "Low";
  if (score >= 50) return "Medium";
  return "High";
}

export function estimateFixMinutes(issues: EnrichedIssue[]): number {
  let total = 0;
  for (const i of issues) {
    if (i.fixDifficulty === "easy")     total += 2;
    else if (i.fixDifficulty === "moderate") total += 10;
    else                                total += 20;
  }
  return Math.min(total, 240);
}

export function estimateFixHours(issues: EnrichedIssue[]): number {
  return estimateFixMinutes(issues) / 60;
}

export function difficultyLabel(d: FixDifficulty): string {
  if (d === "easy")     return "🟢 Easy fix (≈2 min)";
  if (d === "moderate") return "🟡 Moderate fix";
  return "🔴 Advanced fix";
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLIST & SPEC TABLE
// ─────────────────────────────────────────────────────────────────────────────

function isMeaningfulTrimDetected(trimDetected?: string | null): boolean {
  if (trimDetected == null) return false;
  const t = trimDetected.trim();
  if (!t || t === "—" || t === "-" || t === "–" || /^n\/?a$/i.test(t)) return false;
  return /\d/.test(t);
}

export interface ChecklistSpecInput {
  trimMatchKDP?: boolean;
  trimDetected?: string;
  pageCount?: number;
  errorCount: number;
  warningCount: number;
  hasTrimIssues?: boolean;
  hasMarginIssues?: boolean;
  hasBleedIssues?: boolean;
  hasFontIssues?: boolean;
  hasTransparencyIssues?: boolean;
}

export function buildUploadChecklist(input: ChecklistSpecInput): ChecklistItem[] {
  const trimStatus: "pass" | "warning" | "fail" = input.hasTrimIssues
    ? "fail"
    : (input.trimMatchKDP ? "pass" : isMeaningfulTrimDetected(input.trimDetected) ? "fail" : "warning");
  return [
    {
      check: "Trim size matches KDP",
      status: trimStatus,
    },
    {
      check: "Page count (24–828)",
      status: input.pageCount != null
        ? (input.pageCount >= 24 && input.pageCount <= 828 ? "pass" : "fail")
        : "warning",
    },
    {
      check: "Margins & gutter",
      status: input.hasMarginIssues ? "fail" : "pass",
    },
    {
      check: "Bleed (0.125\")",
      status: input.hasBleedIssues ? "fail" : "pass",
    },
    {
      check: "Fonts embedded",
      status: input.hasFontIssues ? "fail" : "pass",
    },
    {
      check: "Transparency flattened",
      status: input.hasTransparencyIssues ? "fail" : "pass",
    },
    {
      check: input.errorCount === 0 ? "No critical errors" : `${input.errorCount} critical error${input.errorCount !== 1 ? "s" : ""} found`,
      status: input.errorCount === 0 ? "pass" : "fail",
    },
    {
      check: input.warningCount === 0 ? "No warnings" : `${input.warningCount} warning${input.warningCount !== 1 ? "s" : ""}`,
      status: input.warningCount === 0 ? "pass" : "warning",
    },
  ];
}

export interface SpecTableInput {
  trimDetected?: string;
  trimMatchKDP?: boolean;
  kdpTrimName?: string | null;
  pageCount?: number;
  fileSizeMB?: number;
  recommendedGutterInches?: number;
  errorCount: number;
  warningCount: number;
  hasTrimIssues?: boolean;
  hasMarginIssues?: boolean;
  hasBleedIssues?: boolean;
  hasFontIssues?: boolean;
}

export function buildSpecTable(input: SpecTableInput): SpecRow[] {
  const trimStatus: "pass" | "warning" | "fail" = input.hasTrimIssues
    ? "fail"
    : (input.trimMatchKDP ? "pass" : isMeaningfulTrimDetected(input.trimDetected) ? "fail" : "warning");
  const kdpRequiredTrim = input.kdpTrimName
    ? input.kdpTrimName.split(" — ")[0]
    : "KDP-supported trim size";
  return [
    {
      requirement: "Trim size",
      yourFile: input.trimDetected ?? "—",
      kdpRequired: kdpRequiredTrim,
      status: trimStatus,
    },
    {
      requirement: "Page count",
      yourFile: input.pageCount != null ? String(input.pageCount) : "—",
      kdpRequired: "24–828 (550 hardcover)",
      status: input.pageCount != null
        ? (input.pageCount >= 24 && input.pageCount <= 828 ? "pass" : "fail")
        : "warning",
    },
    {
      requirement: "Inside margin (gutter)",
      yourFile: input.hasMarginIssues ? "Issue found" : "OK",
      kdpRequired: `${input.recommendedGutterInches ?? "—"}\" min for page count`,
      status: input.hasMarginIssues ? "fail" : "pass",
    },
    {
      requirement: "Bleed",
      yourFile: input.hasBleedIssues ? "Issue found" : "OK",
      kdpRequired: "0.125\" per edge",
      status: input.hasBleedIssues ? "fail" : "pass",
    },
    {
      requirement: "Font embedding",
      yourFile: input.hasFontIssues ? "Issue found" : "OK",
      kdpRequired: "All fonts embedded",
      status: input.hasFontIssues ? "fail" : "pass",
    },
    {
      requirement: "File size",
      yourFile: input.fileSizeMB != null ? `${input.fileSizeMB} MB` : "—",
      kdpRequired: "≤ 650 MB",
      status: input.fileSizeMB != null ? (input.fileSizeMB <= 650 ? "pass" : "fail") : "warning",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectIssueCategories(
  errors: Array<{ rule_id: string; message: string }>,
  warnings: Array<{ rule_id: string; message: string }>
): { hasTrimIssues: boolean; hasMarginIssues: boolean; hasBleedIssues: boolean; hasFontIssues: boolean; hasTransparencyIssues: boolean } {
  const all = [...errors, ...warnings];
  const combined = all.map((i) => `${i.rule_id} ${i.message}`.toLowerCase()).join(" ");
  const allRuleIds = all.map((i) => i.rule_id.toUpperCase());
  return {
    hasTrimIssues:         /trim size|page size|not.*kdp.*size|mixed.*size|inconsistent.*size|trim profile/.test(combined) || allRuleIds.some(r => ["ALLOWED_TRIM_SIZES","CONSISTENT_TRIM","MIXED_PAGE_SIZES","KDP_TRIM_PROFILE","TRIM_BOX","HARDCOVER_TRIM_SIZE"].includes(r)),
    hasMarginIssues:       /margin|gutter|inner|outer|safe\s*area/.test(combined) || allRuleIds.some(r => ["GUTTER_MARGIN","OUTSIDE_MARGIN_MIN","TOP_MARGIN_MIN","BOTTOM_MARGIN_MIN","SAFE_ZONE","TEXT_OUTSIDE_TRIM"].includes(r)),
    hasBleedIssues:        /bleed|trim\s*outside|crop/.test(combined) || allRuleIds.some(r => ["BLEED_VALIDATION","IMAGE_BLEED"].includes(r)),
    hasFontIssues:         /font|embed|subset/.test(combined) || allRuleIds.some(r => ["EMBEDDED_FONTS","RESTRICTED_FONT_EMBEDDING","MIN_FONT_SIZE"].includes(r)),
    hasTransparencyIssues: /transparency|transparent/.test(combined) || allRuleIds.includes("TRANSPARENCY_FLATTENING"),
  };
}

function messagesForCategoryDetection(preflight: {
  errors: Array<{ rule_id: string; message: string }>;
  warnings: Array<{ rule_id: string; message: string }>;
  page_issues?: Array<{ rule_id: string; message: string; severity?: string }>;
}): { errors: Array<{ rule_id: string; message: string }>; warnings: Array<{ rule_id: string; message: string }> } {
  if (preflight.errors.length + preflight.warnings.length > 0) {
    return { errors: preflight.errors, warnings: preflight.warnings };
  }
  const errors: Array<{ rule_id: string; message: string }> = [];
  const warnings: Array<{ rule_id: string; message: string }> = [];
  for (const p of preflight.page_issues ?? []) {
    const s = (p.severity ?? "").toLowerCase();
    const row = { rule_id: p.rule_id, message: p.message };
    if (s === "warning" || s === "minor") warnings.push(row);
    else errors.push(row);
  }
  return { errors, warnings };
}

function derivePreflightErrorWarningCounts(preflight: {
  errors?: Array<{ rule_id?: string; message?: string }>;
  warnings?: Array<{ rule_id?: string; message?: string }>;
  page_issues?: Array<{ severity?: string; rule_id?: string; message?: string }>;
}): { errorCount: number; warningCount: number } {
  const errorKeys  = new Set<string>();
  const warningKeys = new Set<string>();
  for (const e of preflight.errors ?? []) errorKeys.add(e.rule_id || e.message || `_e${errorKeys.size}`);
  for (const w of preflight.warnings ?? []) warningKeys.add(w.rule_id || w.message || `_w${warningKeys.size}`);
  const e = errorKeys.size;
  const w = warningKeys.size;
  if (e + w > 0) return { errorCount: e, warningCount: w };
  const issues = preflight.page_issues;
  if (!issues?.length) return { errorCount: 0, warningCount: 0 };
  const pageEKeys = new Set<string>();
  const pageWKeys = new Set<string>();
  for (const pi of issues) {
    const s = (pi.severity ?? "").toLowerCase();
    const key = pi.rule_id || pi.message || "_";
    if (s === "warning" || s === "minor") pageWKeys.add(key);
    else pageEKeys.add(key);
  }
  return { errorCount: pageEKeys.size, warningCount: pageWKeys.size };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENRICHMENT FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export interface CheckerReportBase {
  outputType: "checker";
  issues: string[];
  chaptersDetected: number;
  fontUsed: string;
  trimSize: string;
  pageCount?: number;
  trimDetected?: string;
  trimMatchKDP?: boolean;
  kdpTrimName?: string | null;
  fileSizeMB?: number;
  recommendedGutterInches?: number;
  page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
}

/** Advisory notices generated by the enrichment layer (not from the engine). */
export interface AdvisoryNotice {
  rule_id: string;
  message: string;
  severity: "info" | "warning";
}

export interface EnrichedCheckerReport extends CheckerReportBase {
  scanDate: string;
  fileNameScanned: string;
  kdpPassProbability: number;
  riskLevel: "Low" | "Medium" | "High";
  readinessScore100: number;
  scoreGrade: ScoreGrade;
  creationTool: string;
  highRiskPageNumbers: number[];
  kdpReady: boolean;
  issuesEnriched: EnrichedIssue[];
  uploadChecklist: ChecklistItem[];
  specTable: SpecRow[];
  estimatedFixHours: number;
  advisoryNotices: AdvisoryNotice[];
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVISORY NOTICES (Sprint 1 enrichment layer additions)
// Generated locally from page count / trim data — no engine change needed.
// ─────────────────────────────────────────────────────────────────────────────

function buildAdvisoryNotices(report: CheckerReportBase): AdvisoryNotice[] {
  const notices: AdvisoryNotice[] = [];
  const pageCount = report.pageCount;

  // 1. Spine text threshold warning (< 80 pages)
  if (pageCount != null && pageCount < MIN_SPINE_TEXT_PAGES) {
    notices.push({
      rule_id: "SPINE_TEXT_WARNING",
      severity: "warning",
      message: `Your book has ${pageCount} pages — the spine is too narrow for title or author text (minimum ~${MIN_SPINE_TEXT_PAGES} pages). Leave the spine blank on your cover design.`,
    });
  }

  // 2. Gutter boundary warning (within 5 pages of a KDP threshold cutover)
  if (pageCount != null) {
    const GUTTER_THRESHOLDS = [150, 300, 500, 700];
    const BOUNDARY = 5;
    for (const threshold of GUTTER_THRESHOLDS) {
      if (Math.abs(pageCount - threshold) <= BOUNDARY) {
        const gutterBelow = getGutterInches(threshold - 1);
        const gutterAbove = getGutterInches(threshold + 1);
        notices.push({
          rule_id: "GUTTER_BOUNDARY_WARNING",
          severity: "info",
          message: `Your page count (${pageCount}) is within ${BOUNDARY} pages of a KDP gutter threshold (${threshold} pages). At ≤${threshold} pages the minimum inside margin is ${gutterBelow}", above it is ${gutterAbove}". Confirm your final page count before setting margins.`,
        });
        break; // only fire once for the nearest threshold
      }
    }
  }

  // 3. Hardcover-specific checks (detect hardcover from kdpTrimName or trimDetected)
  const isHardcover =
    (report.kdpTrimName ?? "").toLowerCase().includes("hardcover") ||
    (report.trimDetected ?? "").toLowerCase().includes("hc-") ||
    HARDCOVER_TRIM_SIZES.some(
      (hc) =>
        report.trimDetected != null &&
        Math.abs(hc.widthInches  - parseFloat((report.trimDetected.match(/^([\d.]+)/) ?? [])[1] ?? "0")) < 0.01 &&
        Math.abs(hc.heightInches - parseFloat((report.trimDetected.match(/×\s*([\d.]+)/) ?? [])[1] ?? "0")) < 0.01
    );

  if (isHardcover) {
    if (pageCount != null && pageCount < HARDCOVER_MIN_PAGES) {
      notices.push({
        rule_id: "HARDCOVER_PAGE_MIN",
        severity: "warning",
        message: `KDP hardcover books require a minimum of ${HARDCOVER_MIN_PAGES} pages. Your file has ${pageCount} pages.`,
      });
    }
    if (pageCount != null && pageCount > HARDCOVER_MAX_PAGES) {
      notices.push({
        rule_id: "HARDCOVER_PAGE_MAX",
        severity: "warning",
        message: `KDP hardcover books have a maximum of ${HARDCOVER_MAX_PAGES} pages. Your file has ${pageCount} pages — reduce content or split into volumes.`,
      });
    }
    // Hardcover trim size validation
    if (report.trimDetected) {
      const trimW = parseFloat((report.trimDetected.match(/^([\d.]+)/) ?? [])[1] ?? "0");
      const trimH = parseFloat((report.trimDetected.match(/[\d.]+\s*[x×]\s*([\d.]+)/i) ?? [])[1] ?? "0");
      const validHC = HARDCOVER_TRIM_SIZES.some(
        (hc) => Math.abs(hc.widthInches - trimW) < 0.01 && Math.abs(hc.heightInches - trimH) < 0.01
      );
      if (!validHC && trimW > 0 && trimH > 0) {
        notices.push({
          rule_id: "HARDCOVER_TRIM_SIZE",
          severity: "warning",
          message: `Your trim size (${report.trimDetected}) is not on KDP's supported hardcover list. Supported hardcover sizes: 5.5×8.5", 6×9", 6.14×9.21", 6.69×9.61", 7×10", 7.44×9.69", 7.5×9.25", 8.5×11".`,
        });
      }
    }
  }

  // 4. Paperback page count upper boundary
  if (!isHardcover && pageCount != null && pageCount > PAPERBACK_MAX_PAGES) {
    notices.push({
      rule_id: "MAX_PAGE_COUNT",
      severity: "warning",
      message: `Your page count (${pageCount}) exceeds the KDP paperback maximum of ${PAPERBACK_MAX_PAGES} pages. KDP will reject this file — split the book into volumes.`,
    });
  }

  return notices;
}

export function enrichCheckerReport(
  report: CheckerReportBase,
  fileNameScanned: string,
  preflight?: {
    errors: Array<{ page: number; rule_id: string; severity: string; message: string }>;
    warnings: Array<{ page: number; rule_id: string; severity: string; message: string }>;
    page_issues?: Array<{ page: number; rule_id: string; severity: string; message: string; bbox: number[] | null }>;
  },
  engineReadinessScore?: number,
  engineApprovalLikelihood?: number,
  creationTool = "unknown",
): EnrichedCheckerReport {
  let errorCount: number;
  let warningCount: number;

  if (preflight) {
    const derived = derivePreflightErrorWarningCounts(preflight);
    errorCount   = derived.errorCount;
    warningCount = derived.warningCount;
    if (errorCount === 0 && warningCount === 0 && report.issues.length > 0) {
      errorCount = report.issues.length;
    }
  } else {
    errorCount   = report.issues.length;
    warningCount = 0;
  }

  const categoryMessages = preflight ? messagesForCategoryDetection(preflight) : null;
  const categories = categoryMessages
    ? detectIssueCategories(categoryMessages.errors, categoryMessages.warnings)
    : { hasTrimIssues: false, hasMarginIssues: false, hasBleedIssues: false, hasFontIssues: false, hasTransparencyIssues: false };
  const normalizedTrimMatchKDP = categories.hasTrimIssues ? false : !!report.trimMatchKDP;

  // Build enriched issues with tool-specific fix instructions
  let issuesEnriched: EnrichedIssue[];
  if (preflight) {
    const fromArrays = [
      ...preflight.errors.map((e)  => enrichIssue(e.message, e.page, e.rule_id, e.severity, creationTool)),
      ...preflight.warnings.map((w) => enrichIssue(w.message, w.page, w.rule_id, w.severity, creationTool)),
    ];
    if (fromArrays.length > 0) {
      issuesEnriched = fromArrays;
    } else if (preflight.page_issues?.length) {
      issuesEnriched = preflight.page_issues.map((p) =>
        enrichIssue(p.message, p.page, p.rule_id, p.severity ?? "error", creationTool)
      );
    } else {
      issuesEnriched = report.issues.map((msg) => ({
        originalMessage: msg,
        humanMessage: toHumanMessage(msg),
        toolFixInstruction: "",
        fixDifficulty: toFixDifficulty("", msg),
        page: undefined,
        rule_id: "",
        severity: "error",
      }));
    }
  } else {
    issuesEnriched = report.issues.map((msg) => ({
      originalMessage: msg,
      humanMessage: toHumanMessage(msg),
      toolFixInstruction: "",
      fixDifficulty: toFixDifficulty("", msg),
      page: undefined,
      rule_id: "",
      severity: "error",
    }));
  }

  // Use engine score if provided, else compute locally
  const hasEngineScore = typeof engineReadinessScore === "number" && Number.isFinite(engineReadinessScore) && engineReadinessScore > 0;
  const hasEngineApproval = typeof engineApprovalLikelihood === "number" && Number.isFinite(engineApprovalLikelihood) && engineApprovalLikelihood > 0;

  const readinessScore100 = hasEngineScore
    ? Math.round(engineReadinessScore)
    : computeReadinessScore100(errorCount, warningCount);
  const score = hasEngineApproval
    ? Math.round(engineApprovalLikelihood)
    : readinessScore100;

  return {
    ...report,
    trimMatchKDP:       normalizedTrimMatchKDP,
    scanDate:           new Date().toISOString(),
    fileNameScanned:    fileNameScanned || "document.pdf",
    kdpPassProbability: score,
    riskLevel:          getRiskLevel(score),
    readinessScore100,
    scoreGrade:         getScoreGrade(readinessScore100),
    creationTool,
    highRiskPageNumbers: getHighRiskPageNumbers(report.page_issues),
    kdpReady:           errorCount === 0,
    issuesEnriched,
    uploadChecklist: buildUploadChecklist({
      trimMatchKDP:         normalizedTrimMatchKDP,
      trimDetected:         report.trimDetected,
      pageCount:            report.pageCount,
      errorCount,
      warningCount,
      ...categories,
    }),
    specTable: buildSpecTable({
      trimDetected:            report.trimDetected,
      trimMatchKDP:            normalizedTrimMatchKDP,
      kdpTrimName:             report.kdpTrimName,
      pageCount:               report.pageCount,
      fileSizeMB:              report.fileSizeMB,
      recommendedGutterInches: report.recommendedGutterInches,
      errorCount,
      warningCount,
      ...categories,
    }),
    estimatedFixHours: estimateFixMinutes(issuesEnriched) / 60,
    advisoryNotices:   buildAdvisoryNotices(report),
  };
}
