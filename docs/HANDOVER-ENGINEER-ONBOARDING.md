# LayoutForge (manu2print) — Engineer Handover & Onboarding

**Purpose:** Onboard a senior architect/engineer with the current project state, stack, protocols, and open problems. Use this as the single handover reference.

**Last updated:** March 2026 (post–Print Ready async worker work).

---

## 1. Onboarding directive and protocol

### 1.1 How we work

- **Product:** Manu2Print is a **business** (KDP-focused “upload → KDP-ready” tools). Goal is to ship and earn; localhost is for testing only. See `.cursor/rules/manu2print-ship-live.mdc`.
- **Decisions:** Implement and maintain without asking unless a real decision is needed (API keys, spend, business/UX choices). Prefer acting over proposing when the path is clear. See `.cursor/rules/scribestack-working-style.mdc`.
- **Security:** No secrets in code. All keys from `process.env`. Admin routes gated by `x-admin-password` vs `ADMIN_PASSWORD_MANU2`. Free tools (e.g. PDF Compressor) are client-side only; paid tools use verify-access and PaymentGate. See `.cursor/rules/layoutforge-stack-and-security.mdc`.
- **Deploy:** After changes that are ready to deploy, provide the exact `git add` / `git commit` / `git push origin main` sequence. See `.cursor/rules/push-after-build.mdc`.

### 1.2 Where the rules live

| Rule file | Purpose |
|-----------|--------|
| `layoutforge-stack-and-security.mdc` | Stack, security, cost, key paths |
| `manu2print-ship-live.mdc` | Ship for live platform (Vercel/domain) |
| `scribestack-working-style.mdc` | Who does what; ship live; act over propose |
| `push-after-build.mdc` | Output push sequence after each deployable change |
| `user-cya-reminder.mdc` | Reminder: move project out of OneDrive to `C:\Dev` if needed |

### 1.3 Key docs to read first

1. **Stack and product:** `.cursor/rules/layoutforge-stack-and-security.mdc` (and optionally `docs/PRODUCT-FACTS.md`, `docs/SECURITY.md`).
2. **Print Ready Check async flow:** `docs/PRINT-READY-CHECK-WORKER.md`. **When it’s broken or stuck in a fix loop:** `docs/PRINT-READY-CHECK-OPERATIONAL.md` (ordered checklist: preflight → migrations → worker → async-only).
3. **Large-file architecture (failure modes, bottlenecks):** `docs/README-LARGE-FILE-ARCHITECTURE-REPORT.md`.
4. **Status and pending:** `docs/STATUS.md`.

---

## 2. Project summary

### 2.1 What it is

- **Name:** LayoutForge (product: manu2print).
- **Repo:** `github.com/QZEE777/LayoutForge`, branch `main`.
- **Live:** Next.js app on **Vercel** (e.g. layout-forge.vercel.app / manu2print). Paid tools: $7 per use or $27 for 6 months (Lemon Squeezy).

### 2.2 Stack (concise)

| Layer | Tech |
|-------|------|
| App | Next.js 15 (App Router), React 19, TypeScript |
| Host (app) | Vercel |
| Host (worker) | Railway (same repo; different start command) |
| DB / auth | Supabase |
| Object storage | R2 (Cloudflare); optional, gated by `USE_R2` |
| Payments | Lemon Squeezy (webhooks, verify-access, PaymentGate on download) |
| AI | Anthropic (Haiku for cost-sensitive flows) |
| Paid file conversion | CloudConvert (keyword/description PDF, EPUB); not used for free PDF Compressor or Print Optimizer |
| PDF/DOCX | pdf-lib, pdfjs-dist, docx, JSZip, mammoth |

### 2.3 Main user flows

- **Print Ready Check:** User uploads PDF → R2 (presigned) → API enqueues row → worker (Railway) runs preflight → frontend polls status → redirect to download page. All sizes (up to 100 MB) use this async path to avoid Vercel 60s timeout.
- **KDP Formatter (DOCX→PDF):** Upload DOCX → format → download PDF. See `src/app/api/kdp-format-docx`, `src/lib/kdpPdfGenerator.ts`, `src/lib/kdpDocxParser.ts`.
- **Keyword Research / Description Generator (PDF):** Client uploads to CloudConvert; app polls job status; when done, may run PDF→text or PDF→DOCX + AI (Anthropic).
- **Free tools:** PDF Compressor, Print Optimizer — client-side only; no server file processing (cost rule in `docs/FREE-TOOLS-COST.md`).

### 2.4 Important paths (code)

| Area | Paths |
|------|--------|
| Print Ready Check (API) | `src/app/api/kdp-pdf-check-from-preflight/route.ts`, `src/app/api/print-ready-check-status/route.ts`, `src/app/api/kdp-pdf-check/route.ts` (legacy sync), `src/app/api/create-upload-url/route.ts` |
| Print Ready Check (worker) | `workers/print-ready-check/run.ts`, `src/lib/printReadyCheckProcess.ts` |
| Checker UI | `src/app/kdp-pdf-checker/page.tsx` |
| Storage | `src/lib/storage.ts`, `src/lib/r2Storage.ts` |
| Supabase client | `src/lib/supabase.ts` (lazy singleton for serverless build) |
| DB migration (worker table) | `supabase/migrations/009_print_ready_checks.sql` |

---

## 3. Snapshot: where we are now

### 3.1 Print Ready Check (current design)

- **All** PDFs for Print Ready Check (up to 100 MB) use the **async path**:  
  `create-upload-url` → client uploads to R2 → `POST /api/kdp-pdf-check-from-preflight` with `{ jobId, fileKey, fileSizeMB }` → API inserts into `print_ready_checks` and returns `checkId` → frontend polls `GET /api/print-ready-check-status?checkId=...` → **worker** (Railway) polls Supabase for `pending`, runs preflight (R2 → preflight API → report → save), updates row to `done`/`failed` → frontend redirects to `/download/{downloadId}`.
- The **sync** path (`POST /api/kdp-pdf-check` with FormData) is no longer used by the checker UI for normal uploads (we set `SERVER_MAX_MB = 0`); it remains in code for legacy/fallback. Sync path is the one that was hitting Vercel 60s and 504s.
- **Worker:** One process, long-running. Polls every 12s when idle; processes one job at a time. Configured via `railway.toml`: build `npm ci`, start `npm run worker:print-ready-check`. **Must not** run `next start` for the worker service on Railway.

### 3.2 Build and deploy state

- **Vercel:** Build is green. Next.js app builds and deploys from `main`. `workers/` is excluded from `tsconfig.json` so the worker is not type-checked by `next build`. Supabase client is a lazy singleton so build-time “Collecting page data” does not require env.
- **Railway:** Repo includes `railway.toml` so that when this repo is deployed as a **worker** service, it runs `npm run worker:print-ready-check`. `package-lock.json` has been updated so `npm ci` on Railway includes `tsx` and esbuild.

### 3.3 Database

- **print_ready_checks:** Required for async Print Ready Check. Migration: `supabase/migrations/009_print_ready_checks.sql`. Must be run in Supabase SQL Editor if not already applied. Columns: `id`, `file_key`, `our_job_id`, `file_size_mb`, `status`, `result_download_id`, `error_message`, `created_at`, `updated_at`.

---

## 4. Current problems and what’s been tried

### 4.1 500 on `POST /api/kdp-pdf-check-from-preflight`

- **Symptom:** Browser reports “Failed to load resource: 500” for `api/kdp-pdf-check-from-preflight`. This is the request that enqueues the check after the user has uploaded the PDF to R2.
- **Likely causes:**  
  1. **Supabase not configured on Vercel** — Missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`. We added an explicit check and return 503 with “Supabase is not configured” in that case.  
  2. **Table missing or RLS** — `print_ready_checks` not created (migration 009 not run) or RLS blocking the insert. The route logs insert errors (message/code) to Vercel function logs.  
  3. **Insert succeeds but no row returned** — We added a null check and return 500 with a clear message instead of throwing on `row.id`.
- **What to do:**  
  - Confirm in Vercel → Project → Environment Variables that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set for Production (and Preview if used).  
  - In Supabase, confirm table `print_ready_checks` exists and that the service role can insert (no RLS blocking the app).  
  - Reproduce and check Vercel → Deployments → latest → Functions/Logs for the logged Supabase error or “insert succeeded but no row id.”

### 4.2 Railway: wrong process (Next.js instead of worker)

- **Symptom:** Railway logs show “next start” and “Stopping Container” / SIGTERM. So the container is running the **Next.js** app instead of the **worker**.
- **Cause:** The Railway service was using the default or a custom start command that runs the web app (`next start` or `npm start`).
- **Fix applied in repo:** Added `railway.toml` with `startCommand = "npm run worker:print-ready-check"`. Railway should pick this up when deploying from this repo. If the dashboard overrides the start command, set it explicitly to `npm run worker:print-ready-check` and ensure it is **not** `next start` or `npm start` for the **worker** service.
- **What to do:** Redeploy the Railway service from `main`. Confirm in Railway that the start command is `npm run worker:print-ready-check`. Confirm the service is the one intended for the worker (separate from any other service that might run the Next app elsewhere).

### 4.3 Railway: `npm ci` and lockfile (resolved)

- **Symptom:** Railway build failed with “Missing: tsx@… from lock file” (and esbuild).  
- **Fix:** Ran `npm install` locally and committed the updated `package-lock.json` so `tsx` and dependencies are in the lockfile.  
- If similar “missing from lock file” errors appear again, run `npm install` at repo root and commit `package-lock.json`.

### 4.4 Summary table

| Problem | Where | Status / next step |
|--------|--------|---------------------|
| 500 on kdp-pdf-check-from-preflight | Vercel API | Check Supabase env on Vercel; confirm `print_ready_checks` exists and is insertable; use Vercel function logs for Supabase error or “no row id”. |
| Railway runs Next.js instead of worker | Railway | Use `railway.toml` (already in repo) or set Start command to `npm run worker:print-ready-check`; redeploy. |
| npm ci missing tsx/esbuild | Railway build | Fixed with updated lockfile; if it recurs, run `npm install` and commit `package-lock.json`. |

---

## 5. Environment checklist (worker and app)

For the **worker** (Railway), the following must be set (same as the Next app for these):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KDP_PREFLIGHT_API_URL` (preflight engine base URL)
- `R2_ENDPOINT` (or `R2_ACCOUNT_ID`)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `USE_R2` (optional; set to `true` if using R2 for report storage)

Worker loads env from Railway Variables (or `.env` when run locally via `npm run worker:print-ready-check`).

---

## 6. Quick reference

- **Run Next app locally:** `npm run dev`
- **Run worker locally:** `npm run worker:print-ready-check` (from repo root; needs `.env` with same vars as above)
- **Build (must pass before deploy):** `npm run build`
- **Push after changes:** Use the exact `git add` / `git commit` / `git push origin main` block from the push-after-build rule.

This document is the single handover snapshot; update it when major state or problems change.
