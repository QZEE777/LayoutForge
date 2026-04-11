# Print Ready Check — Operational Checklist (Stop the Fix Loop)

This doc is the **single source of truth** when Print Ready Check is broken or stuck in an endless loop of fixes. Follow the order below; each step depends on the previous one.

---

## Why the “endless loop” happens

Several things must be true at once. If you fix only one (e.g. worker, or timeout) but another is missing (e.g. preflight down), the tool still fails and it feels like the same bug. **Fix in dependency order.**

---

## Dependency order

```
Preflight engine (running, URL set)
    → Worker can call it
    → Migration 010 (claim RPC) applied
        → Worker can claim jobs
    → All uploads use async path (no sync through Vercel)
        → No 504 from Vercel timeout
```

---

## Checklist (in order)

### 1. Preflight engine is running and URL is set

- **What it is:** The KDP preflight engine (Python FastAPI + Celery in `kdp-preflight-engine/`) must be deployed and reachable. It was historically on **Render**; if Render is shut down, deploy it elsewhere (e.g. **Railway**: new Web Service, root dir `kdp-preflight-engine`, `Dockerfile.live`, Redis e.g. Upstash).
- **Check:**  
  - **Vercel** → Project → Settings → Environment Variables: `KDP_PREFLIGHT_API_URL` = base URL (e.g. `https://your-preflight.up.railway.app`), no trailing slash.  
  - **Railway** (worker service): same `KDP_PREFLIGHT_API_URL`.  
  - Open `{KDP_PREFLIGHT_API_URL}/health` in a browser → should return OK.
- **If this is missing:** Both sync and async paths fail. Fix this first; no point debugging worker or timeouts until preflight is up.

### 2. Supabase migrations applied

- **009** — `print_ready_checks` table exists.  
- **010** — `claim_print_ready_check` RPC exists (worker uses it to claim jobs).
- **Check:** In Supabase SQL Editor, run something like `SELECT * FROM print_ready_checks LIMIT 1;` (no error). Then check that RPC exists (e.g. in Supabase Dashboard → Database → Functions, or try calling it from the worker and see logs).
- **If 010 is missing:** Worker logs will show `claim_print_ready_check RPC failed`. Apply `supabase/migrations/010_claim_print_ready_check.sql`.

### 3. Worker running on Railway (or other host)

- **What it is:** The Node worker that polls `print_ready_checks`, downloads PDF from R2, calls preflight, saves report, updates row. Configured by `railway.toml` + `Dockerfile.worker` (repo root).
- **Check:** Railway service logs show `[worker] Print Ready Check worker started` and no repeated `claim_print_ready_check RPC failed`. Env vars on the worker must include: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `KDP_PREFLIGHT_API_URL`, `R2_*`, `USE_R2` (if needed).
- **If worker is wrong:** Ensure start command is `npm run worker:print-ready-check`, **not** `next start`. Root directory = repo root.

### 4. All checker uploads use async path (no sync through Vercel)

- **What it is:** The checker page always uses: presigned **R2 PUT** → `POST /api/kdp-pdf-check-from-preflight` → poll status → download. The PDF never goes through Vercel’s body in the primary flow, so no 504 from Vercel timeout on large files.
- **Check:** `handleSubmit` in `src/app/kdp-pdf-checker/page.tsx` should only call `create-upload-url` + R2 + enqueue (not `POST /api/kdp-pdf-check` with FormData for real checks).
- **Tradeoff:** Every scan uses polling (a few seconds) instead of a sync shortcut; that avoids the timeout loop.

### 5. R2 same on Vercel and worker

- **Check:** `create-upload-url` (Vercel) and the worker use the same bucket and credentials. If the worker can’t find the file, check `file_key` in the failed row and that the object exists in the bucket (e.g. `uploads/<uuid>.pdf`).

### 6. One end-to-end test

- Upload a PDF (e.g. 2–5 MB). Wait for “Checking…” then redirect to download page.
- If it fails: check `print_ready_checks.error_message` for that row and Railway worker logs. Often the cause is: preflight URL wrong/down, RPC missing, or R2 key mismatch.

---

## Quick reference: “It’s broken again”

1. Is **preflight** up? (`KDP_PREFLIGHT_API_URL` set, `/health` returns OK.)  
2. Are **migrations 009 + 010** applied?  
3. Is the **worker** running and claiming jobs? (Railway logs.)  
4. Does the checker UI still use **only** the R2 + enqueue path? (No full-PDF sync through Vercel for production checks.)

If all four are yes and it still fails, use `print_ready_checks.error_message` and worker logs for the exact error.
