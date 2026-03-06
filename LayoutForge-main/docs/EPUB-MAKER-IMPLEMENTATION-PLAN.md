# Kindle EPUB Maker — Implementation Plan (Mini Launch)

## Current state
- **Route:** `/epub-maker` exists but renders **ComingSoonLayout** only (no conversion).
- **Conversion:** CloudConvert supports **DOCX → EPUB**; your app already uses CloudConvert for PDF tools and has download/storage patterns for KDP Formatter (PDF).
- **Download & payment:** `/api/download/[id]/[filename]` already allows `.epub`; PaymentGate and Lemon Squeezy are tool-agnostic (pass `tool: "epub-maker"`).

---

## What has to be done

### 1. Backend: CloudConvert DOCX → EPUB

| File | Change |
|------|--------|
| **`src/app/api/cloudconvert-upload-url/route.ts`** | Add `toolType: "epub-maker"`. Accept **.docx** only. Create job: `import/upload` → `convert` (docx → epub, output `book.epub`) → `export/url`. Return `id` (UUID), `jobId`, `uploadUrl`, `formData` (same shape as kdp-formatter-pdf). |
| **`src/app/api/cloudconvert-job-status/route.ts`** | Add handling for `toolType === "epub-maker"` (require `id`). When job `finished`: read export task file URL, fetch EPUB buffer, `writeOutput(id, "book.epub", buffer)`, then `updateMeta(id, { outputFilename: "book.epub", processingReport: { outputType: "epub", chaptersDetected: 0, issues: [], fontUsed: "", trimSize: "" } })` so format-report and download page have a report. Return `{ status: "done", id, downloadUrl }`. |

### 2. Storage type

| File | Change |
|------|--------|
| **`src/lib/storage.ts`** | In `StoredManuscript.processingReport`, extend `outputType` to `"pdf" | "docx" | "epub"`. |

### 3. Download page: support EPUB

| File | Change |
|------|--------|
| **`src/app/download/[id]/page.tsx`** | Use `source=epub` from query (and/or `report?.outputType === "epub"`). When EPUB: `downloadFilename = report?.outputFilename || "book.epub"`; "New upload" link → `/epub-maker`; `PaymentGate` `tool="epub-maker"`; heading/copy "EPUB Ready!" / "Your Kindle-ready EPUB is ready to download." Extend local `ProcessingReport` type so `outputType` includes `"epub"`. If `source=epub` but no report yet, still use filename `book.epub` and tool `epub-maker`. |

### 4. EPUB Maker page: full flow (replace Coming Soon)

| File | Change |
|------|--------|
| **`src/app/epub-maker/page.tsx`** | Replace **ComingSoonLayout** with a real flow (mirror **kdp-formatter-pdf**): upload **DOCX** only (max 50MB), call `POST /api/cloudconvert-upload-url` with `toolType: "epub-maker"`, upload file to returned URL, poll `GET /api/cloudconvert-job-status?jobId=...&toolType=epub-maker&id=...` until `status: "done"`, then `router.push(/download/${id}?source=epub)`. Same header style as other tools (logo, "All Tools" → `/formatter`). Optional later: book title / author metadata. |

### 5. Formatter page: show EPUB Maker as launchable

| File | Change |
|------|--------|
| **`src/app/formatter/page.tsx`** | Move **Kindle EPUB Maker** back into **PAID_TOOLS** with `href: "/epub-maker"` and pricing, and remove it from the **COMING_SOON** list so it appears as a "Launch" card. |

### 6. (Optional) Format report for EPUB

| File | Change |
|------|--------|
| **`src/app/api/format-report/route.ts`** | No change required if meta is created in job-status with `processingReport` and `outputFilename`. If you prefer not to create meta for epub, the download page can rely only on `?source=epub` and fixed `book.epub` + tool `epub-maker`. |

---

## Flow summary

1. User opens **/epub-maker** (or formatter and clicks Kindle EPUB Maker).
2. User uploads a **.docx**; client gets upload URL from **cloudconvert-upload-url** (toolType `epub-maker`), uploads file, then polls **cloudconvert-job-status** (toolType `epub-maker`, id).
3. When job is done, job-status saves **book.epub** via `writeOutput` and writes minimal **meta** (so format-report works).
4. Client redirects to **/download/[id]?source=epub**.
5. Download page shows PaymentGate (`tool="epub-maker"`, `downloadId=id`); after payment (or beta), user downloads **book.epub** via existing download API.

---

## Payment

- Reuse existing Lemon Squeezy products: pass `tool: "epub-maker"` and same `priceType` (e.g. single_use / subscription) so checkout and webhook work as today; no new product required for mini launch.

---

## Order of implementation

1. **cloudconvert-upload-url** — add `epub-maker`, DOCX → EPUB job.
2. **cloudconvert-job-status** — handle `epub-maker`, write EPUB + meta.
3. **storage** — add `"epub"` to `outputType`.
4. **download/[id]/page** — EPUB filename, copy, tool, and `source=epub`.
5. **epub-maker/page** — full upload + poll + redirect (replace Coming Soon).
6. **formatter/page** — EPUB Maker back in PAID_TOOLS with Launch.

---

## Testing

- Upload a small .docx to /epub-maker, confirm redirect to /download/[id]?source=epub and that **book.epub** downloads (with or without payment gate for your test).
- Confirm "All Tools" from epub-maker and from download (source=epub) goes to /formatter and that formatter shows Kindle EPUB Maker as Launch.
