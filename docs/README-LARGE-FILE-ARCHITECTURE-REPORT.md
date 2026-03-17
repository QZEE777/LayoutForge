# Manu2Print — Large-File Architecture Report (Read-Only)

*Saved for later access. Diagnostic architecture analysis; no code changes. March 2026.*

---

## A) Current Architecture Flow (step-by-step)

### 1. Where uploads enter

- **Direct to Vercel (body in request):**
  - **`POST /api/upload`** — `FormData` → `file.arrayBuffer()` → `Buffer` → `saveUpload(buffer)`. Comment: "keep files under 50MB." Platform body limit (e.g. Vercel ~4.5 MB for API routes) applies before that.
  - **`POST /api/kdp-pdf-check`** — `FormData` → `Buffer.from(await f.arrayBuffer())` → full PDF in memory. Rejects >10 MB (with message to compress) and >50 MB. Used for Print Ready when file ≤1 MB.
  - **`POST /api/upload-proxy`** — Forwards `FormData` to preflight engine. Rejects when `Content-Length` > 4.5 MB.

- **Client uploads elsewhere; Vercel only coordinates:**
  - **`POST /api/create-upload-url`** — Returns presigned R2 URL + `jobId`/`fileKey`. Client `PUT`'s file to R2. Used for Print Ready when file >1 MB and ≤100 MB.
  - **`POST /api/cloudconvert-upload-url`** — Returns CloudConvert job + upload URL. Client uploads to CloudConvert. Used for keyword-research-pdf, description-generator-pdf, epub-maker.
  - **`POST /api/generate`** — Accepts stored file `id`; `readStoredFile(id)` loads full file into memory; creates CloudConvert job; uploads that buffer to CloudConvert; returns `jobId`. Client polls for completion.

### 2. Print Ready Check (two paths)

**Small file (≤1 MB):**

1. User selects PDF → frontend `POST /api/kdp-pdf-check` with `FormData`.
2. API: read full body into `buffer`; validate size; load with pdf-lib; optional `runPreflightCheck(baseUrl, buffer, fileName)`:
   - `POST ${baseUrl}/upload` with `buffer` (FormData).
   - Poll `GET ${baseUrl}/status/${job_id}` every 2s until "completed" or "failed" (up to ~55s).
3. Build report, `saveUpload(buffer, ...)`, `updateMeta`, Supabase `verification_results`, trigger annotate, optional R2 report URL.
4. Return `{ id: stored.id }` in the same request.
5. Frontend redirects to `/download/${id}`.

**Large file (>1 MB, ≤100 MB):**

1. Frontend: `POST /api/create-upload-url` → get presigned URL; client `PUT` file to R2.
2. Frontend: `POST /api/kdp-pdf-check-from-preflight` with `{ jobId, fileKey, fileSizeMB }`.
3. API: insert into `print_ready_checks` (status `pending`), return `{ checkId }` immediately (no processing in request).
4. External worker (separate process): polls `print_ready_checks`, takes `pending` row; `getFileByKey(fileKey)` (full PDF from R2 into memory); POST to preflight `/upload`; poll `/status`; GET `/report`; same save/report logic as above; update row to `done`/`failed` with `result_download_id` or `error_message`.
5. Frontend: polls `GET /api/print-ready-check-status?checkId=...` until `done` or `failed`; on `done` redirects to `/download/${downloadId}`.

So: **small-file Print Ready is fully synchronous inside one API request**; **large-file Print Ready is already "upload → store (R2) → queue (DB) → async process (worker) → notify via poll."**

### 3. Other tools (high level)

- **KDP Formatter (DOCX→PDF):** Upload (e.g. `/api/upload`) then `POST /api/kdp-format-docx` with `id`. API: `readStoredFile(id)` (full DOCX in memory) → parse → `generateKdpPdf` → `writeOutput`. Single request holds full file and does all work.
- **Keyword Research / Description Generator (PDF):** Client uploads to CloudConvert; client polls `GET /api/cloudconvert-job-status?jobId=...&toolType=...`. When CloudConvert job is "finished," that **same** status request: fetches text export URL; if text too short, may run **inline** PDF→DOCX via CloudConvert (new job + poll loop, up to ~90s) and extract text; then calls Anthropic for keywords/description; returns result. So one status response can be long and memory-heavy.
- **Generate (DOCX/PDF/EPUB→PDF):** `POST /api/generate` with stored `id`; API reads file, creates CloudConvert job, uploads to CloudConvert, returns `jobId`. Client polls `GET /api/generate/status`; when done, status handler downloads result PDF and calls `writeOutput`. Work is split; the "status" handler does one download + write per poll.

### 4. Storage and memory

- **Storage:** `saveUpload` / `readStoredFile` / `writeOutput` use either local fs (`/tmp` on Vercel or `data/uploads`) or R2 when `USE_R2=true`. No streaming: read/write are full-buffer.
- **Preflight:** External service (e.g. Railway). API or worker sends full PDF in one `FormData` body to `/upload`; no chunked/streaming in this codebase.
- **R2:** `getFileByKey` streams from S3 API into chunks then `Buffer.concat(chunks)` → full buffer in memory.

---

## B) Failure Analysis (why large files break)

1. **Request lifecycle and time**
   - Small-file Print Ready keeps the HTTP request open for: preflight upload + polling (up to ~55s) + report fetch + save + DB. With `maxDuration = 60`, anything slower (e.g. cold preflight, big report) can hit Vercel's limit → 504 → HTML error body → frontend JSON parse error.
   - `cloudconvert-job-status` can do PDF→DOCX + extraction + AI in one response; that can exceed 60s or memory for large PDFs.

2. **Memory**
   - Any path that does `await file.arrayBuffer()` or `readStoredFile(id)` or `getFileByKey(fileKey)` holds the full file in a single Node `Buffer`. Large PDFs/DOCX (e.g. 50–100 MB) multiply memory (buffer + copies during parsing/upload), which can cause OOM or severe slowdown in a fixed-size serverless container.

3. **Body and size limits**
   - Vercel API route body is ~4.5 MB. So "upload large file in one request" to Vercel is already blocked for big files. The app avoids that for Print Ready >1 MB by using R2 presigned upload and for some tools by using CloudConvert upload. Remaining risk is routes that assume "file already in storage" and then load it fully (e.g. `readStoredFile`, `getFileByKey`) inside the same request that also does heavy work.

4. **Sync blocking**
   - Small-file checker: entire pipeline (preflight upload + poll + report + save) is synchronous from the client's perspective and from the function's execution. One long step blocks the response.
   - `cloudconvert-job-status`: when CloudConvert is "finished," the handler may run PDF→DOCX and AI in the same invocation, so "poll for status" and "do heavy work" are coupled.

5. **Worker vs API**
   - Large-file Print Ready is already decoupled: API only enqueues; worker does the long work. So for that flow, "large files" are intended to be handled by the async model. Remaining failure modes are: worker not deployed or not running, DB (e.g. `print_ready_checks`) not migrated, or preflight/network slow so worker itself hits internal timeouts or memory.

---

## C) Architectural Bottlenecks

| Pressure point | Where | Effect |
|----------------|--------|--------|
| **Full-file buffering** | `readStoredFile`, `getFileByKey`, `file.arrayBuffer()` in upload routes, CloudConvert download in status | Entire file in memory; large files increase RAM and GC, risk OOM in serverless. |
| **Request-lifecycle coupling** | Small-file Print Ready (`kdp-pdf-check`); "status" handlers that do extra work when job is done (`cloudconvert-job-status`, possibly `generate/status`) | Response time = upload + external calls + processing. Exceeds 60s or platform limits → 504 / timeouts. |
| **Sync polling inside request** | `runPreflightCheck` (poll every 2s up to ~55s); `extractTextViaPdfToDocx` (poll up to ~90s) inside `cloudconvert-job-status` | One HTTP request holds the connection and does multiple round trips; total time and memory add up. |
| **No job queue for most tools** | Only Print Ready (large) uses `print_ready_checks` + worker. Formatter, keyword/description, generate "status" do work in the responding request. | Heavy processing is tied to a single invocation; no retries or backpressure beyond client retry. |
| **Ephemeral /tmp on Vercel** | `UPLOAD_DIR` = `/tmp/uploads` when `VERCEL`; `writeOutput` to fs when not R2 | Large temp files and output in /tmp; size limits and cold starts can cause failures or inconsistency. |
| **Single process for "status"** | When CloudConvert job finishes, `cloudconvert-job-status` does extraction + AI in the same handler | That one request pays the cost of fetch + convert + AI; large PDF or slow AI → timeout or memory spike. |

---

## D) Risks if Unchanged

- **Small-file Print Ready (≤1 MB):** Remains vulnerable to 504 and "invalid JSON" if preflight is slow or cold; experience degrades for files near 1 MB or under poor network.
- **Formatter (DOCX→PDF):** Large DOCX (e.g. 50 MB) keeps full doc in memory plus PDF generation; risk of OOM or timeout on Vercel.
- **Keyword/Description (PDF):** When the CloudConvert job completes, the status endpoint can run a long PDF→DOCX + extraction + AI path; large or complex PDFs can time out or OOM.
- **Operational:** Reliance on a single long-lived request for "result ready" means no built-in retry, no clear "job" identity for support, and harder debugging when the only symptom is 504 or blank/error response.

---

## E) Conceptual Async Model (high level)

- **Upload:** User selects file → system returns a **stable upload target** (presigned URL or similar). Client uploads **directly** to that target (object store or external service). No large body through Vercel.
- **Store:** As soon as the upload is known (e.g. key or URL), a **job record** is created (e.g. "pending") and a **job id** is returned. Response is quick; no processing yet.
- **Queue / worker:** A **separate process** (or queue consumer) picks "pending" jobs, loads input from storage by reference (streaming or chunked where possible), runs preflight/convert/AI, writes results to storage and updates the job (e.g. "done" / "failed").
- **Notify / result:** User gets result by **polling** a status endpoint (e.g. by job id) or by **webhook/email** when done. No "wait in one request" for the heavy work.
- **Decoupling:** Request lifecycle = "accept, persist reference, enqueue, respond." Processing = "worker pulls job, processes, updates." So time limits and memory limits apply to the worker, not to the HTTP request.

Print Ready large-file flow already follows this pattern (R2 upload → enqueue → worker → poll). Other tools (small-file checker, formatter, keyword/description "status" handler) still do "work in the request" and would need to move toward the same pattern to be robust for large files.

---

## F) Questions for the Founder Before Designing a Solution

1. **Worker deployment:** Is the Print Ready Check worker (the one that polls `print_ready_checks`) actually deployed and running (e.g. on Railway)? If not, large-file Print Ready will stay "pending" forever even though the API and frontend support async.

2. **Migration 009:** Has `009_print_ready_checks.sql` been applied in the live Supabase project? Without the table, the enqueue path will fail.

3. **Acceptable latency:** For tools that today return "result in this response," are you OK with "job id now, result in 1–5 minutes via poll or email," or do some flows need to stay "wait on the same request" (and thus stay size/speed limited)?

4. **Which tools to prioritize:** Beyond Print Ready, which large-file failures matter most: Formatter (DOCX), Keyword/Description (PDF), EPUB, or something else? That drives where to introduce queue + worker next.

5. **Preflight engine:** Where does the preflight engine run (e.g. Railway), and does it have its own time/memory limits or cold starts that could make "upload + poll" slow even when the Manu2Print API/worker are fast?

6. **R2 usage:** Is `USE_R2=true` in production for all relevant flows? That affects whether large files ever hit Vercel `/tmp` and whether "store first, process later" is consistently possible.

7. **Definition of "large":** What file size band causes the problems you care about (e.g. 5–20 MB, or 50–100 MB)? That will guide whether the main fix is "move more tools to async" vs "also add streaming/chunking or size caps" in workers.

---

*End of report. No code or config was changed; analysis and clarification only.*
