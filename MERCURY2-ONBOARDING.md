# LayoutForge (ScribeStack) — Onboarding for Mercury 2

Use this document to get Mercury 2 up to speed on the codebase. Paste it (and optionally attach or paste key files) when starting a session.

---

## Project overview

**LayoutForge** is a Next.js app for KDP (Kindle Direct Publishing) authors. Users upload manuscripts (DOCX or PDF), configure options, and get KDP-ready outputs: print PDFs, keyword research, Amazon listing text (description, bio, BISAC), and related tools. The product is also referred to as **ScribeStack**.

- **DOCX flow:** Green theme. Upload → KDP Formatter / Keyword Research / Description Generator (DOCX) → preview → download.
- **PDF flow:** Red theme. PDF tools: KDP Formatter PDF, Keyword Research PDF, Description Generator PDF. Plus a free **PDF Compressor** (lead magnet; email required).
- **Theming:** Homepage uses color-coded rows: DOCX tools = green, PDF tools = red. Each flow keeps its theme on tool pages, preview, and download.

---

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS
- **Key deps:** mammoth (DOCX), pdf-lib, pdf-parse, unpdf (PDF text), jszip, uuid. CloudConvert used for PDF conversion/optimization (KDP Formatter PDF, PDF Compressor).
- **Config:** `next.config.ts` — `serverExternalPackages: ["unpdf"]`, `serverActions.bodySizeLimit: "50mb"`.

---

## Repository structure (relevant paths)

```
src/
  app/
    page.tsx                    # Home: tool rows (docxTools, pdfTools, kindleTools, publishingTools)
    layout.tsx
    kdp-formatter/page.tsx       # DOCX formatter (green)
    kdp-formatter-pdf/page.tsx   # PDF formatter (red); creates CloudConvert job, polls status, redirects to download
    keyword-research/page.tsx
    keyword-research-pdf/page.tsx
    description-generator/page.tsx
    description-generator-pdf/page.tsx
    pdf-compress/page.tsx        # Lead magnet: email → upload URL → CloudConvert → download
    epub-maker/page.tsx
    royalty-calculator/page.tsx
    upload/page.tsx
    preview/[id]/page.tsx        # DOCX preview/configure
    download/[id]/page.tsx       # Shared download; ?source=pdf for PDF flow (red UI)
    admin/page.tsx               # Back office (ADMIN_SECRET); lists leads
    dashboard/page.tsx
    metadata/[id]/page.tsx
  app/api/
    upload/route.ts
    parse/route.ts
    generate/route.ts            # DOCX flow
    generate/status/route.ts      # Polled by PDF formatter; when CloudConvert done, downloads PDF, writeOutput(id, "kdp-print.pdf", buffer)
    kdp-formatter-pdf/route.ts    # Creates CloudConvert job, returns jobId + upload URL
    keyword-research/route.ts
    keyword-research-pdf/route.ts
    description-generator/route.ts
    description-generator-pdf/route.ts
    pdf-compress/route.ts         # Returns upload URL for direct-to-CloudConvert
    pdf-compress/status/route.ts
    download/[id]/[filename]/route.ts   # Serves file via readOutput(id, filename)
    admin/leads/route.ts          # GET with ADMIN_SECRET
    preview-pdf/[id]/route.ts
    metadata/optimize/route.ts
  lib/
    storage.ts                   # All persistence: uploads, meta, output files, leads
```

---

## Storage and persistence (`src/lib/storage.ts`)

- **Upload dir:** `VERCEL ? "/tmp/uploads" : "data/uploads"`. Files: `{id}{ext}`, `{id}.meta.json`, `{id}.compression.json` (compression leads), `out/{id}/{filename}` (generated outputs).
- **Meta:** `StoredManuscript` in `{id}.meta.json` (id, originalName, mimeType, storedPath, createdAt, convertJobId, convertStatus, outputFilename, trimSize, withBleed, fontSize, pageCount, wordCount, title, leadEmail).
- **Key functions:** `saveUpload`, `getStored`, `saveMeta`, `updateMeta`, `readStoredFile`, `deleteStored`, `cleanupExpired`, `writeOutput(id, filename, data)`, `readOutput(id, filename)`, `listLeads()`.
- **PDF formatter output:** Saved as `out/{id}/kdp-print.pdf` via `writeOutput(id, "kdp-print.pdf", pdfBuffer)` in `generate/status` when CloudConvert job completes. Served at `/api/download/[id]/kdp-print.pdf`.

---

## Important flows

1. **KDP Formatter (PDF):** User uploads on `kdp-formatter-pdf` → POST `api/kdp-formatter-pdf` (create CloudConvert job) → client uploads file to CloudConvert, then polls `api/generate/status?id=&jobId=` → when status is "done", status route has already downloaded the result and saved with `writeOutput(id, "kdp-print.pdf", buffer)` → redirect to `download/[id]?source=pdf`. Download page shows "KDP Print PDF" / "Ready to download" and link to `api/download/[id]/kdp-print.pdf`.
2. **DOCX:** Upload → `api/upload` → `api/generate` (or preview) → `preview/[id]` → `download/[id]` (no source=pdf).
3. **PDF Compressor:** Email + optional name → `api/pdf-compress` returns jobId + upload URL → user uploads PDF to CloudConvert → poll `api/pdf-compress/status` → on done, download from CloudConvert; lead stored in `{id}.compression.json`.
4. **Keyword / Description (PDF):** 4MB client-side limit; over limit show message and link to PDF Compressor. Use `unpdf` for text extraction (dynamic import in route).

---

## Conventions

- One task at a time; after code changes, user often runs: `git add . && git commit -m "..." && git push origin main`.
- Prefer minimal commentary; don’t change working code unnecessarily; if unclear, ask one short question.
- Admin: `ADMIN_SECRET` env for `/admin` and `GET /api/admin/leads`.

---

## Quick reference

| What | Where |
|------|--------|
| Output PDF filename (PDF formatter) | `"kdp-print.pdf"` (fixed) |
| Download URL for that PDF | `/api/download/[id]/kdp-print.pdf` |
| Where PDF is saved when job completes | `generate/status/route.ts` → `writeOutput(id, "kdp-print.pdf", pdfBuffer)` |
| Theming | DOCX = green, PDF = red (header, banner, buttons, download page when `?source=pdf`) |

---

*End of onboarding brief. Attach or paste specific files when asking Mercury 2 to implement a task.*
