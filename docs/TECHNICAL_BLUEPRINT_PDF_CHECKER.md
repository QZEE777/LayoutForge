# Technical Blueprint — PDF Checker (Tool #1)

This document is a **reference checklist** for how the PDF Checker (Print Ready Check / Tool #1) must work in production.
It exists to prevent “fixes that go nowhere” and to stop regressions by anchoring work to **hard invariants**.

---

## 0) Components (the “gears”)

### Frontend
- Upload UI: `src/app/kdp-pdf-checker/page.tsx`
- Results/preview page: `src/app/download/[id]/page.tsx`
- PDF viewer + overlays: `src/components/CheckerPdfViewer.tsx`
- Payment gate: `src/components/PaymentGate.tsx`

### APIs
- Enqueue / start check: `src/app/api/kdp-pdf-check-from-preflight/route.ts`
- Poll status: `src/app/api/print-ready-check-status/route.ts`
- Format report for UI: `src/app/api/format-report/route.ts`
- Preview PDF serving (R2-backed): `src/app/api/r2-file/route.ts`

### Worker
- Worker loop: `workers/print-ready-check/run.ts`
- Orchestration logic: `src/lib/printReadyCheckProcess.ts`

### Storage + data
- Worker job table: `print_ready_checks` (Supabase migrations `009_*` and `010_*`)
- Report/meta storage: `storage.ts` + R2 metadata (`uploads/<id>/meta.json`) when `USE_R2=true`

---

## 1) Hard Invariants (non-negotiable)

### 1.1 ID types must not be mixed
- `checkId` = `print_ready_checks.id`
- `downloadId` = the stored metadata id the UI reads with:
  - `GET /api/format-report?id=<downloadId>`

**Regression rule:** If `checkId` is passed where `downloadId` is expected, the UI can appear to “load” but returns:
- 404 from `/api/format-report` (or “No processing report for this file.”)

Keep all client code and server endpoints consistent with:
- `format-report` expects `downloadId`, not `checkId`.

### 1.2 Preview must support byte-range loading
`CheckerPdfViewer` uses `pdfjs-dist` and for large PDFs it must be able to fetch only needed byte ranges.

Required behaviors from the preview endpoint:
- Honor incoming `Range` requests
- Return `206 Partial Content` when `Range` is provided
- Return `Accept-Ranges: bytes` always
- Return correct:
  - `Content-Type: application/pdf`
  - `Content-Length`
  - `Content-Range`

### 1.3 Preflight engine `/file/<jobId>` is unreliable for preview/annotation
The preflight engine can return `404 File not found` even when the report exists.

**Rule:** For base preview, do not depend on `/file/<jobId>`.
Use the stable stored/original PDF source instead (R2-backed preview).

### 1.4 Annotations are best-effort and must never block base preview
The red/yellow overlay PDF is extra. If annotation generation is slow or fails:
- the user must still see the normal PDF preview quickly
- “annotated preview preparing” may remain best-effort

---

## 2) Tool #1 Large File Flow (production)

### A) Large PDF upload (recommended)
1. Upload PDF directly to R2 via presigned URL (`/api/create-upload-url`)
2. Call:
   - `POST /api/kdp-pdf-check-from-preflight`
   - with `{ jobId, fileKey, fileSizeMB }`
3. API enqueues a `print_ready_checks` row and returns `{ success: true, checkId }`
4. Frontend polls:
   - `GET /api/print-ready-check-status?checkId=...`
5. Worker processes:
   - claims job via `claim_print_ready_check`
   - runs preflight report generation
   - saves stored metadata + result for UI
6. Frontend redirects to:
   - `/download/<downloadId>?source=checker`
7. UI renders:
   - `/api/format-report?id=<downloadId>`
   - preview PDF from the stable R2-backed preview route (range capable)

---

## 3) Definition of Done (UAT checklist)

For your sellable “operational mode”, verify all items:

1. **Upload**: A ~28.8MB PDF completes upload + check enqueue + polling.
2. **Report**: `GET /api/format-report?id=<downloadId>` returns `200` and includes:
   - `outputType: "checker"`
   - `page_issues` (may be empty for pass cases)
3. **Preview speed**: `CheckerPdfViewer` shows page 1 quickly (seconds, not minutes).
4. **Range correctness**:
   - browser requests show `Range`
   - preview endpoint responds with `206` and correct headers
5. **Annotations**:
   - if slow, base preview still works
   - annotated status doesn’t block usability

If any fail, stop feature changes and address the invariant involved (IDs vs Range vs storage vs dependency blocking).

---

## 4) Note about the `format-report` fallback

Short-term production safety:
- keep the fallback mapping behavior in `src/app/api/format-report/route.ts`

**Never remove it until** ID wiring is fully verified end-to-end with:
- the exact “checkId” and “downloadId” values produced by Tool #1
- repeated runs for at least:
  - a failing KDP file
  - a passing KDP file

---

## 5) Where to look when something regresses

1. `404 /api/format-report`:
   - almost always an ID mismatch (checkId vs downloadId)
2. Blank/slow PDF preview:
   - almost always Range support / preview headers issue
3. Base preview OK but annotations stuck:
   - annotations are best-effort; check annotated status only
4. Preflight 404:
   - don’t use preflight `/file/...` for base preview

