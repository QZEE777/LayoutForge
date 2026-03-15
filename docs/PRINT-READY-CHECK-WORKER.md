# Print Ready Check — Async Worker

Large-file Print Ready Check (R2 upload flow) uses an **async job + worker** so Vercel never times out. The API enqueues a row in Supabase and returns immediately; a long-running worker processes jobs and updates the row.

## Flow

1. User uploads PDF to R2 (presigned URL), then calls `POST /api/kdp-pdf-check-from-preflight` with `{ jobId, fileKey, fileSizeMB }`.
2. API inserts a row into `print_ready_checks` with `status = 'pending'` and returns `{ success: true, checkId }`.
3. Frontend polls `GET /api/print-ready-check-status?checkId=...` every 2.5s until `status` is `done` or `failed`.
4. **Worker** (this process) polls Supabase for `status = 'pending'`, sets `processing`, runs preflight (R2 → preflight API → report → save), then sets `done` + `result_download_id` or `failed` + `error_message`.
5. When the frontend sees `done`, it redirects to `/download/{downloadId}?source=checker`.

## Run locally

From repo root, with env in `.env` (same as Next app for Supabase, R2, preflight URL):

```bash
npm run worker:print-ready-check
```

Or:

```bash
npx tsx workers/print-ready-check/run.ts
```

## Environment (worker)

Same as the Next app for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KDP_PREFLIGHT_API_URL`
- `R2_ENDPOINT` (or `R2_ACCOUNT_ID`)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `USE_R2` (optional; set to `true` if using R2 for storage)

Load via `.env` in the repo root (worker uses `dotenv/config`).

## Deploy worker (Railway)

The project uses **Railway** for the Print Ready Check worker (and optionally the preflight engine). The Next app stays on Vercel.

1. **Supabase**: Run migration `supabase/migrations/009_print_ready_checks.sql` in the Supabase SQL Editor so the `print_ready_checks` table exists.

2. **Railway — new service for the worker**:
   - In your Railway project, add a **new service** (same repo as LayoutForge, or link this repo).
   - **Root directory**: repo root (where `package.json`, `workers/`, and `railway.toml` live).
   - The repo includes **`railway.toml`**: build = `npm ci`, start = `npm run worker:print-ready-check`. If Railway picks it up, you don’t need to set a custom start command. Otherwise set **Start command** to `npm run worker:print-ready-check` (do **not** use `next start` — that’s for the Vercel app).
   - **Environment**: Add the same env vars as the Next app (see list above): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `KDP_PREFLIGHT_API_URL`, `R2_*`, `USE_R2`. Use Railway’s “Variables” for the service.
   - Deploy. The worker runs in a loop; one instance is enough (polls every 12s when idle, processes one job at a time).

**Other hosts**: You can run the same start command on Fly.io or another host; build = `npm install`, start = `npm run worker:print-ready-check`, same env vars.

## Database

Table: `print_ready_checks` (see `supabase/migrations/009_print_ready_checks.sql`).

- `id` (UUID): Check id; returned as `checkId` and used in the status API.
- `file_key`, `our_job_id`, `file_size_mb`: Inputs for the worker.
- `status`: `pending` | `processing` | `done` | `failed`.
- `result_download_id`: Set when `status = 'done'`; frontend redirects to `/download/{result_download_id}`.
- `error_message`: Set when `status = 'failed'`.
