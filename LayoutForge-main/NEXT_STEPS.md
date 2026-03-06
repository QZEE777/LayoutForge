# LayoutForge — Summary & Next Steps

## What This Project Is

**LayoutForge** is a Next.js 15 app for **KDP (Kindle Direct Publishing) manuscript formatting**. Users can:

1. **Upload** a manuscript (PDF, DOCX, or EPUB) up to 50MB.
2. **Preview** word count, chapters, estimated pages, and a short text preview.
3. **Configure** trim size (5×8", 5.5×8.5", 6×9", 8.5×11"), font size (9–14pt), and optional bleed.
4. **Generate** a KDP-ready PDF (and optionally a Kindle EPUB).
5. **Download** the generated PDF and EPUB from the download page.

Tech stack: **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**. Backend uses file storage under `data/uploads`, in-memory rate limiting (10 uploads/min per IP), and optional **pandoc** + **xelatex** for DOCX→PDF. EPUB is generated via **epub-gen**.

---

## Cleanups Done

- **`src/app/api/generate/route.ts`**: Removed leading/trailing blank lines, unused `getPageDimensions` / `pageWidth` / `pageHeight`, and unused imports (`getPageDimensions`, `getGutterMargin`, `KDP_MARGINS`).
- **`src/lib/kdpSpecs.ts`**: Bleed dimensions fixed so both width and height add `2 * KDP_BLEED_INCHES` (0.25" total per axis) for consistent full-bleed.

No syntax or lint errors reported in `src/`. The codebase is ready to keep building.

---

## Recommended Next Steps

### 1. Run the app locally (easiest)

**Double-click `START-HERE.bat`** in the project folder. It will install (first time only), start the server, then open the app in your browser. Keep the black server window open while you use the app. See **README-START.txt** for step-by-step instructions.

### 2. PDF generation path

- **DOCX**: Uses `pandoc` + `xelatex`. Ensure `pandoc` and a LaTeX distribution (e.g. TeX Live with xelatex) are installed on the server/machine where `npm run build` / `next start` runs. The current command does not yet apply KDP margins/trim in LaTeX; consider a custom template or post-processing with `pdf-lib` to enforce trim/bleed.
- **PDF**: Currently pass-through only (saved as-is). To “reformat” PDFs for KDP (margins, trim, bleed), add a pipeline using `pdf-lib` and/or `puppeteer` (already in dependencies).

### 3. Optional: support `.txt` end-to-end

- `src/lib/uploadValidation.ts` allows `.txt` / `text/plain`.
- `src/app/api/parse/route.ts` and `src/app/api/generate/route.ts` do not handle `text/plain`. Either add parsing/generation for plain text or remove `.txt` from `UPLOAD_CONFIG` to avoid accepting files that later fail.

### 4. Security and robustness

- **Download URLs**: If `id` or filenames ever include special characters, use `encodeURIComponent` when building `/api/download/[id]/[filename]` links.
- **Rate limiting**: Stored in memory; resets on restart. For production, consider Redis or a persistent store.
- **Cleanup**: Call `cleanupExpired()` from `@/lib/storage` on a schedule (cron or serverless timer) to delete uploads older than 24 hours.

### 5. Testing and CI

- Add unit tests for `uploadValidation`, `kdpSpecs`, and `rateLimit`.
- Add an E2E test (e.g. Playwright) for: upload → preview → generate → download.
- Run `npm run lint` and `npm run build` in CI.

### 6. Production

- Set `data/uploads` (and any temp dirs) outside the app or use object storage (e.g. S3) and refactor `storage.ts` to use it.
- Ensure pandoc + xelatex (and any other CLI tools) are available in the deployment environment.
- Add error monitoring (e.g. Sentry) and basic request logging.

---

## Quick reference

| Command        | Purpose              |
|----------------|----------------------|
| `npm run dev`  | Start dev server     |
| `npm run build`| Production build     |
| `npm run start`| Run production build |
| `npm run lint` | Run Next.js lint     |

| Path / area        | Purpose                          |
|--------------------|----------------------------------|
| `src/app/`         | Pages and API routes             |
| `src/lib/`         | Validation, storage, KDP specs, rate limit |
| `data/uploads/`    | Uploaded files and generated outputs (create at runtime) |

You’re set to continue feature work, PDF/EPUB improvements, and production hardening from here.
