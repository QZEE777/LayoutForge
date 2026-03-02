# KDP Formatter DOCX — Rebuild Instructions

**Product:** manu2print.com — KDP publishing toolkit for indie authors  
**Scope:** Complete rebuild of the KDP Formatter DOCX pipeline.  
**Do not touch:** `storage.ts`, `PaymentGate.tsx`, `epub-maker/*`, `download/*`, `cloudconvert-*`, other tools.

---

## 1. Product Goal (from MANU2PRINT-KDP.md)

- **Input:** One manuscript DOCX (max 50MB).
- **Output:** Review DOCX + final PDF. Same content, one consistent layout.
- **Flow:** Upload → Configure (title, author, trim, front matter) → Download DOCX or PDF.

**Template (fixed):**

- One font: Times New Roman (body + headings).
- One spacing: Single line, one paragraph space after.
- One heading style: H1 (chapter), H2 (section), H3 (subsection).

**Structure from document:**

- Word Heading 1/2/3 → chapter/section/subsection.
- Or lines starting with `CHAPTER 1` / `SECTION 1` (or roman) when "Already KDP-ready" is **not** checked.
- When "Already KDP-ready" is checked: only Word Heading 1/2/3 define structure; no paragraph promotion.

**Content:** Preserve every paragraph. Drop only stray 1–3 digit lines (page numbers). Read `word/document.xml` directly (JSZip, no Mammoth).

---

## 2. Files to Rebuild

| File | Purpose |
|------|---------|
| `src/lib/kdpDocxParser.ts` | Parse DOCX → `ParsedContent` |
| `src/lib/kdpDocxGenerator.ts` | `ParsedContent` + `KdpFormatConfig` → DOCX buffer |
| `src/lib/kdpComplianceEngine.ts` | Run KDP rule checks → `string[]` issues |
| `src/lib/kdpReport.ts` | Build `KdpProcessingReport` for storage/API |
| `src/app/kdp-formatter/page.tsx` | Upload, configure, generate UI |
| `src/app/api/kdp-format-docx-preview/route.ts` | API: parse → generate DOCX → write output → update meta |

---

## 3. Data Contracts

### 3.1 ParsedContent (parser output)

```ts
interface ParsedParagraph {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

interface ParsedChapter {
  number: number;
  title: string;
  level: 1 | 2 | 3;
  paragraphs: ParsedParagraph[];
  images: ParsedImage[];
}

interface ParsedContent {
  frontMatter: { title: string; author: string; copyright: string; isbn: string };
  chapters: ParsedChapter[];
  estimatedPageCount: number;
  detectedIssues: string[];
}
```

**Parser rules:**

- Content before first H1/CHAPTER/SECTION goes into a chapter with **empty title** (`""`). Never invent "Front Matter" or any label.
- Sanitize paragraph text: strip control chars, leading/trailing pipe/zwsp.
- Drop paragraphs that are only 1–3 digits.
- `estimatedPageCount = max(24, ceil(totalParagraphs / 25))`.
- Call `runKdpCompliance()` and set `detectedIssues`.

### 3.2 KdpFormatConfig (from kdpConfig.ts)

Use existing `KdpFormatConfig` and `DEFAULT_CONFIG`. The generator uses only:

- `bookTitle`, `authorName`, `copyrightYear`, `isbn`
- `trimSize`, `alreadyFormatted`
- `frontMatter.titlePage`, `frontMatter.copyrightPage`, `frontMatter.toc`, `frontMatter.dedication`, `frontMatter.dedicationText`

**Note:** The generator uses a fixed template (Times New Roman, single spacing). Config fields like `bodyFont`, `headingFont`, `fontSize`, etc. are for future use; ignore them for this rebuild.

### 3.3 Generator rules

- **Skip from body:** Chapters with empty title (pre-chapter bucket). Chapters whose title matches book title, "By {author}", or author name (title-page leakage).
- **Front matter:** Build from config only. Title page, copyright page, TOC, optional dedication. Never render the manuscript's own title/front matter as a body chapter.
- **Body:** H1 = page break before (except first), H2/H3 = no page break. `keepNext` on headings and last para before next chapter. `widowControl` on body paragraphs.
- **Sections:** Front (no page numbers) + body (page numbers, headers with title/author, footers with page number).

---

## 4. kdpComplianceEngine.ts

```ts
export interface ComplianceInput {
  estimatedPageCount: number;
  chaptersCount: number;
  hasPreChapterContent: boolean;
  totalParagraphs: number;
}

export function runKdpCompliance(input: ComplianceInput): string[]
```

**Checks:**

- Page count &lt; 24 → issue
- Page count &gt; 828 → issue
- Chapters = 0 and paragraphs &gt; 0 → "No chapters detected..."
- Chapters &gt; 0 and paragraphs = 0 → "Chapters detected but no body paragraphs..."

Return human-readable strings. Do not modify content.

---

## 5. kdpReport.ts

```ts
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

export function buildDocxPreviewReport(options: {...}): KdpProcessingReport
```

- `sectionsDetected` = count of level-1 chapters.
- `lessonsDetected` = count of level-2 chapters.
- `formatReviewText` = from `buildFormatReviewText(content, config)` (formatReviewExport.ts).

---

## 6. API Route: kdp-format-docx-preview

**Flow:**

1. Validate `id`, `config`; require `bookTitle`, `authorName`.
2. `getStored(id)` → meta. `readStoredFile(id)` → buffer.
3. `parseDocxForKdp(buffer, { alreadyFormatted })` → content.
4. `generateKdpDocx(content, fullConfig)` → docxBuffer.
5. `outputFilenameFromTitle(bookTitle, ".docx")` → filename.
6. `writeOutput(id, filename, docxBuffer)`.
7. `buildFormatReviewText(content, fullConfig)` → formatReviewText.
8. `buildDocxPreviewReport(...)` → report.
9. `updateMeta(id, { outputFilename, convertStatus: "done", processingReport: report })`.
10. Return `{ success: true, id, report: {...} }`.

**Error handling:** 400 for missing/invalid input, parse failure. 404 for file not found. 500 for generation failure.

---

## 7. Page: kdp-formatter/page.tsx

**Steps:** Upload → Configure → Processing → redirect to `/download/{id}`.

**Upload:** Drag/drop or file input. Validate: .docx only, max 50MB. POST to `/api/upload`, get `id`, go to Configure.

**Configure:** Load meta from `/api/docx-meta?id=...` to prefill title, author, dedication. Form fields: book title*, author*, copyright year, ISBN, trim size, book type, front matter (title page, copyright, TOC, dedication). "Already KDP-ready" checkbox.

**Generate:** POST to `/api/kdp-format-docx-preview` or `/api/kdp-format-docx` with `{ id, config }`. On success, `router.push(/download/{id})`. On error, show message.

**UI:** Keep existing layout (header, steps, upload zone, config form, processing state). Do not change branding or layout structure unless explicitly requested.

---

## 8. Integration Points (do not change)

- **Upload:** `POST /api/upload` — returns `{ id }`. Uses `storage.ts`.
- **Storage:** `getStored`, `readStoredFile`, `writeOutput`, `updateMeta` from `@/lib/storage`.
- **Download:** `/download/[id]` — fetches `/api/format-report?id=...`, shows report, download button to `/api/download/[id]/[filename]`.
- **format-report:** Returns `processingReport` from meta.
- **formatReviewExport:** `buildFormatReviewText(content, config)` — used by route and stored in report.

---

## 9. Avoid (regressions)

- **Never** invent or display "Front Matter" as a chapter title. Use empty string for pre-chapter bucket.
- **Never** render the manuscript's title page / front matter as a body chapter. Filter it out.
- **Never** pass through raw OOXML or inject fonts. One template only.
- **Never** drop paragraphs except 1–3 digit lines. Preserve bold/italic.
- **Always** sanitize paragraph text (control chars, pipe, zwsp) to avoid render artifacts.

---

## 10. Dependencies

- `jszip` — parse DOCX.
- `docx` — generate DOCX.
- `@/lib/kdpConfig` — `KdpFormatConfig`, `getTrimSize`, `getGutterInches`, `validateTrimSize`.
- `@/lib/formatFileName` — `outputFilenameFromTitle`.
- `@/lib/formatReviewExport` — `buildFormatReviewText`.

---

## 11. Test Checklist

After rebuild:

1. Upload a DOCX with CHAPTER 1, body text → no "Front Matter" chapter in output.
2. Upload a DOCX with only body (no headings) → pre-chapter bucket skipped; no crash.
3. Upload a DOCX with "PRIMAL BALANCE" in title → no vertical bar/pipe artifact.
4. Generate Review DOCX → download works, report shows chapters/estimated pages.
5. Generate PDF (if route exists) → full document, not truncated.
6. "Already KDP-ready" checked → only Word Heading 1/2/3 define structure.
7. "Already KDP-ready" unchecked → CHAPTER N / SECTION N also create headings.
