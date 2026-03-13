# KDP PDF Checker — Architecture Overview

This document describes the current hosting, upload pipeline, storage, and viewer behavior so we can stabilize the system before making further changes.

---

## 1. Hosting / Infrastructure

| Component | Where it runs | Notes |
|-----------|----------------|--------|
| **Frontend** | **Vercel** | Next.js app (manu2print.com). Serves the checker page, download page, and all UI. |
| **API layer (site)** | **Vercel** | Next.js API routes: `/api/kdp-pdf-check`, `/api/kdp-pdf-check-from-preflight`, `/api/view-pdf/[id]`. Same process as the frontend. |
| **Preflight engine** | **Render** | Single Docker container (API + Celery worker). Service URL e.g. `https://layoutforge.onrender.com`. Uses `Dockerfile.live`; listens on `PORT` (Render sets 10000). |
| **Redis** | **Upstash** | Managed Redis (TLS). Used by the preflight engine for job status and report JSON. Not used by the frontend. |
| **Celery** | **Render (same container)** | Runs in the same container as the FastAPI app. Broker and result backend = Upstash Redis. Worker runs `validate_pdf` task. |

**Env / wiring**

- **Vercel:** `KDP_PREFLIGHT_API_URL` (server-side; also used by `/api/upload-proxy` for large-file uploads). `NEXT_PUBLIC_KDP_PREFLIGHT_API_URL` (same URL, for polling status/report when file > 4 MB).
- **Render:** `REDIS_URL` (Upstash), `LOCAL_UPLOAD_DIR=/app/data/uploads`. Disk mounted at `/app/data` (persistent).

---

## 2. Upload Pipeline

### A) Files under 4 MB

| Step | Who | What |
|------|-----|------|
| 1 | Browser | User selects PDF, clicks “Check PDF”. |
| 2 | Browser | `POST /api/kdp-pdf-check` with `FormData` (file in body). |
| 3 | **Vercel** (API route) | Receives the file (under Vercel body limit ~4.5 MB). Reads body to `Buffer`. |
| 4 | Vercel | `saveUpload(buffer, ...)` → stores PDF under site storage (see §3). Gets `stored.id`. |
| 5 | Vercel | If `KDP_PREFLIGHT_API_URL` set: `fetch(engine/upload)` with the same file → gets `job_id`; polls `engine/status/{job_id}` until completed; gets report from `engine/report/{job_id}`. If not set: uses pdf-lib for basic trim/page count only. |
| 6 | **Preflight engine (Render)** | Receives file at `POST /upload`, stores to local disk (`/app/data/uploads/{job_id}.pdf`), enqueues Celery task, returns `{ job_id }`. |
| 7 | **Celery (Render)** | Runs validation, writes status + report JSON to Redis. Does **not** delete the PDF from disk. |
| 8 | Vercel | Builds `processingReport` with `page_issues`, `hasPdfPreview: true`. Calls `updateMeta(stored.id, { processingReport })`. |
| 9 | Vercel | Returns `{ id: stored.id }` to browser. |
| 10 | Browser | Redirects to `/download/{id}`. |

**Summary (≤4 MB):** Browser → **Vercel** (receives + stores file) → Vercel calls **Render** for validation → report stored in Redis; Vercel stores report + PDF by `id` → frontend gets report and PDF from Vercel.

---

### B) Files over 4 MB

| Step | Who | What |
|------|-----|------|
| 1 | Browser | User selects PDF, clicks “Check PDF”. |
| 2 | Browser | Does not call `/api/kdp-pdf-check` (would exceed Vercel body limit). Calls `POST /api/upload-proxy` with `FormData` (same-origin; proxy forwards to Render). |
| 3 | **Vercel** (`/api/upload-proxy`) | If `Content-Length` > 4.5 MB returns 413. Else forwards POST to Render `/upload`. |
| 4 | **Preflight engine (Render)** | Receives file at `POST /upload`, stores to `/app/data/uploads/{job_id}.pdf`, enqueues Celery task, returns `{ job_id }`. |
| 5 | **Celery (Render)** | Same as (A): validation, Redis status + report. PDF remains on disk. |
| 6 | Browser | Polls `GET engine/status/{job_id}` until completed. |
| 7 | Browser | Calls **Vercel** `POST /api/kdp-pdf-check-from-preflight` with `{ jobId, fileSizeMB }` (no file). |
| 8 | **Vercel** | Fetches `GET engine/report/{job_id}`, builds `processingReport`, creates minimal placeholder PDF, returns `{ id: stored.id }`. |
| 9 | Browser | Redirects to `/download/{id}`. |

**Summary (>4 MB):** Browser → **Vercel (upload-proxy)** → **Render**. Files over 4.5 MB are rejected by the proxy (Vercel body limit). For larger files, Render CORS must be fixed and direct upload re-enabled (see `kdp-preflight-engine` CORS and DEPLOY-LIVE).

---

## 3. File Storage

### Site (Vercel)

- **Where:** `UPLOAD_DIR` = `/tmp/uploads` on Vercel, or `data/uploads` locally. Files stored as `{id}.pdf`.
- **When:** On `saveUpload()` in `/api/kdp-pdf-check` (small files) or in `/api/kdp-pdf-check-from-preflight` (placeholder only for large-file flow).
- **How long:** On Vercel, `/tmp` is ephemeral (lost when the serverless instance is recycled). There is no durable retention; effectively “until the instance is torn down.”
- **Large files:** The user’s PDF is **never** sent to Vercel for files > 4 MB, so it is **not** stored on the site at all. Only a one-page placeholder PDF is stored for the from-preflight flow so that `saveUpload` can return an `id`.

### Preflight engine (Render)

- **Where:** `LOCAL_UPLOAD_DIR` = `/app/data/uploads`. File path: `{job_id}.pdf`. Render disk is persistent (mounted at `/app/data`).
- **When:** On `POST /upload` (both small- and large-file flows that hit the engine).
- **How long:** No automatic deletion after validation. `delete_local()` exists but is only used on **security-check failure** in the upload handler. So PDFs **persist** on the engine disk until the volume is cleared or the service is redeployed/recreated.
- **Who can read:** Currently there is **no** HTTP endpoint to download or read the file. Only the Celery worker reads it locally by path.

**Conclusion:** For files ≤4 MB the site stores the PDF (ephemerally on Vercel). For files >4 MB the engine stores the PDF (persistently on Render); the site does not have a copy and has no way to serve it.

---

## 4. Viewer Requirements

- The **CheckerPdfViewer** needs:
  - **`pdfUrl`** — a URL that returns the PDF (e.g. `GET pdfUrl` → `application/pdf` body).
  - **`pageIssues`** — array of `{ page, rule_id, severity, message, bbox }` for overlays.
  - **`totalPages`** — for navigation.

- **Current behavior:** The download page passes `pdfUrl={`/api/view-pdf/${id}`}` only when `report.hasPdfPreview` is true. That route serves the file stored **on the site** for that `id`. So the viewer only works when the site actually has the user’s PDF (i.e. small-file flow).

- **Can the viewer load from the engine?** Yes. The viewer only needs a URL that returns the PDF. If the engine exposed e.g. `GET /file/{job_id}` returning the stored PDF (with appropriate CORS and, if desired, access control), the frontend could pass that URL as `pdfUrl` and the same viewer would work. So: **the viewer does require a URL to the PDF; it can load from an engine endpoint like `/file/{job_id}` if that endpoint exists and is usable from the browser.**

---

## 5. Why Files >4 MB Cannot Be Previewed

It is **not** only one cause; it’s the combination:

1. **Vercel body limit (~4.5 MB)**  
   The site cannot receive the file for large PDFs. So the site never has the bytes to store or serve.

2. **No stored PDF on the site for large files**  
   In the from-preflight flow we deliberately do not send the file to Vercel. We only send `jobId` (and optional `fileSizeMB`). So the site never calls `saveUpload(userPdf, ...)` for the real file—only for a placeholder. So `hasPdfPreview` is not set and the viewer is not shown.

3. **No endpoint to retrieve the file from the engine**  
   The engine keeps the PDF on disk at `/app/data/uploads/{job_id}.pdf` but does not expose a route like `GET /file/{job_id}`. So even though we have `job_id` in the large-file flow, the frontend has no URL it can use to load that PDF.

So: **Vercel limit** prevents the site from ever having the file; **by design** we don’t store the user’s PDF on the site for the from-preflight flow; and the **missing engine endpoint** prevents the browser from using the copy that already exists on Render. All three must be addressed for large-file preview: we need a way to give the frontend a URL to the PDF (simplest: engine serves it).

---

## 6. Proposed Solution (Simplest Stable Architecture)

**Goal:** One pipeline where all PDFs (small and large) are validated the same way, and the viewer can show the PDF with overlays when possible.

**Constraints:** No change to validation logic, security checks, or file-size limits on the server. Only add storage exposure and frontend wiring.

### 6.1 Engine: store and serve the PDF

- **Keep current behavior:** `POST /upload` stores the file at `{LOCAL_UPLOAD_DIR}/{job_id}.pdf` and does not delete it after validation.
- **Add:** `GET /file/{job_id}` that:
  - Reads from `get_local_path(job_id)`.
  - If the file exists, returns it with `Content-Type: application/pdf` and suitable `Cache-Control` (e.g. short cache or no-store).
  - If the file does not exist or job is unknown, returns 404.
- **Security:** Rely on job_id being a UUID (hard to guess). Optionally restrict to same-origin or a short-lived token later; for minimal change, UUID is acceptable.
- **CORS:** Engine already uses `allow_origins=["*"]`, so the browser can request this URL from the site’s origin.
- **Retention:** Keep “no automatic delete” for now. Optional: add a background job or TTL to delete files older than e.g. 24 hours to avoid disk fill.

### 6.2 Site: record PDF URL for from-preflight

- In **`/api/kdp-pdf-check-from-preflight`**, when saving the report:
  - Build a **PDF URL** for the viewer: `pdfSourceUrl = `${baseUrl}/file/${jobId}`` (same `baseUrl` as for `/report/{jobId}`).
  - Store in metadata something the download page can use, e.g. `processingReport.hasPdfPreview = true` and `processingReport.pdfSourceUrl = pdfSourceUrl` (or a dedicated field on the stored document).
- **Download page:** When `report.hasPdfPreview` is true and `report.pdfSourceUrl` is set, pass `report.pdfSourceUrl` as `pdfUrl` to `CheckerPdfViewer` instead of `/api/view-pdf/${id}`. When `hasPdfPreview` is true and `pdfSourceUrl` is not set (small-file flow), keep using `/api/view-pdf/${id}`.

Result:

- **Small files:** Unchanged. File goes to Vercel → engine; site stores PDF; viewer uses `/api/view-pdf/{id}`.
- **Large files:** File goes only to engine; engine keeps PDF and exposes `GET /file/{job_id}`; site stores report + `pdfSourceUrl`; viewer uses `pdfSourceUrl` (engine URL). Same validation, same report shape; only the source of the PDF URL changes.

### 6.3 Single pipeline

- Validation is already the same (engine + Redis + Celery) for both flows.
- The only difference is **who receives the upload** (Vercel vs engine) and **where the PDF is read from** for the viewer (site vs engine). Adding `GET /file/{job_id}` and `pdfSourceUrl` makes the two flows equivalent from the user’s perspective (report + visual overlay) without changing validation or server-side limits.

### 6.4 Optional: temporary retention

- If desired, engine can later add a 24h (or similar) TTL: e.g. delete `{job_id}.pdf` when report is older than 24h, or run a periodic job. That does not change the architecture above; it only limits how long the PDF is available at `/file/{job_id}`.

---

## Summary Table

| Item | Current | After proposal |
|------|--------|----------------|
| Validation | Same engine for both flows | Unchanged |
| PDF storage (≤4 MB) | Site (Vercel /tmp) | Unchanged |
| PDF storage (>4 MB) | Engine only (Render disk) | Unchanged; engine serves it |
| Viewer (≤4 MB) | `/api/view-pdf/{id}` | Unchanged |
| Viewer (>4 MB) | No viewer (no PDF URL) | `GET engine/file/{job_id}` via `pdfSourceUrl` |
| New surface | — | Engine: `GET /file/{job_id}`; Site: store and use `pdfSourceUrl` for from-preflight |

This gives a single, stable pipeline: all PDFs validated the same way, with the viewer able to show the PDF and overlays for both small and large files.
