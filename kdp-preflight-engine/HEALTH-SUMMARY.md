# KDP Preflight — Health Summary Report

Quick reference for debugging **Render** (preflight engine) and **Vercel** (site) errors.

---

## Architecture

| Component | Host | Role |
|-----------|------|------|
| **Site (Next.js)** | Vercel | KDP PDF Checker page, `/api/kdp-pdf-check`, `/api/kdp-pdf-check-from-preflight`, `/api/view-pdf/[id]` |
| **Preflight engine** | Render | FastAPI: `POST /upload`, `GET /status/{job_id}`, `GET /report/{job_id}`, `GET /health`. Same container runs Uvicorn + Celery worker. |
| **Redis** | Upstash | Job status + report storage; Celery broker + result backend. |

Flow: User uploads PDF → (site or direct to Render) → Render stores file, queues Celery task → Worker runs validation → Report stored in Redis → Site polls status/report.

---

## Render (Preflight Engine) — Common Errors & Fixes

### 1. **Redis / Celery connection failures**

- **Symptom:** Build succeeds but service crashes or logs show `ConnectionRefusedError`, `SSL: CERTIFICATE_VERIFY_FAILED`, or Celery unable to connect to broker.
- **Cause:** `REDIS_URL` is `rediss://...` (Upstash). Celery/kombu may not pass `ssl_cert_reqs=CERT_NONE` from the URL to the Redis connection.
- **Fix (Render env):**
  - Ensure **REDIS_URL** is set as a **Secret** (e.g. `rediss://default:YOUR_TOKEN@profound-grouper-4481.upstash.io:6379?ssl_cert_reqs=CERT_NONE`).
  - If Celery still fails, add explicit broker SSL in code (see below) or use Upstash’s recommended `ssl_cert_reqs=required` if your Upstash instance supports it.

### 2. **Celery broker SSL (if Redis URL has `rediss://`)**

If you see Celery worker errors about SSL when connecting to Redis, configure SSL in the Celery app (e.g. in `app/tasks/validate_pdf.py`):

```python
# After celery_app = Celery(...)
if settings.broker_url.strip().lower().startswith("rediss://"):
    celery_app.conf.broker_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}
    celery_app.conf.redis_backend_use_ssl = {"ssl_cert_reqs": ssl.CERT_NONE}
```

(Add `import ssl` at top.)

### 3. **Cold start / spin-down (Free tier)**

- **Symptom:** First request after idle returns 503 or timeout; subsequent requests work.
- **Cause:** Render free tier spins down the service after inactivity.
- **Mitigation:** Document that “first check may take ~30–60 seconds.” Optionally use a cron (e.g. UptimeRobot) to hit `GET /health` every few minutes to reduce spin-downs.

### 4. **Disk / upload directory**

- **Symptom:** Upload returns 500 or “File not found” when worker runs.
- **Cause:** `LOCAL_UPLOAD_DIR` must match where the container writes and where the worker reads. Render blueprint sets `LOCAL_UPLOAD_DIR=/app/data/uploads` and mounts a disk at `/app/data`.
- **Check:** In Render dashboard, confirm **Disk** is attached and **Environment** has `LOCAL_UPLOAD_DIR=/app/data/uploads`.

### 5. **Health checks**

- **Liveness:** `GET https://<your-render-url>/health` — app is up. Returns `{"status":"ok","service":"KDP Preflight Engine"}`.
- **Readiness:** `GET https://<your-render-url>/health/ready` — app + Redis. Returns 200 with `"redis":"ok"` when Redis is reachable, **503** when Redis is down (so load balancers don’t send traffic). Prefer this as Render’s health check path if supported.

### 6. **Expected log warnings (safe to ignore for this setup)**

- **Celery: "running the worker with superuser privileges"** — The container runs as root so the app can write to Render’s mounted disk (`/app/data`). To remove the warning you’d run as a non-root user and ensure the volume is writable; for Render free tier this is acceptable.
- **Celery: "ssl_cert_reqs=CERT_NONE ... vulnerable to man in the middle"** — Upstash Redis over TLS often needs `CERT_NONE` for compatibility. The broker is a managed service; risk is low. For stricter security you’d use proper cert validation if Upstash supports it.

### 7. **Build / runtime**

- **Dockerfile:** `Dockerfile.live` (API + worker in one container). Ensure Render uses **Root Directory** `kdp-preflight-engine` and **Dockerfile path** `./Dockerfile.live`.
- **Port:** The Dockerfile uses `$PORT` (default 8000); Render sets `PORT=10000`. Root path: `GET /` returns 200 and points to `/health` and `/health/ready` so probes don’t get 404.

---

## Vercel (Site) — Common Errors & Fixes

### 1. **Preflight not used / “Preflight not configured”**

- **Symptom:** Checker always does basic (trim + page count) only, or API returns “KDP_PREFLIGHT_API_URL is not set.”
- **Cause:** Env vars not set in Vercel.
- **Fix (Vercel → Settings → Environment Variables):**
  - **KDP_PREFLIGHT_API_URL** = Preflight service URL (e.g. `https://kdp-preflight-engine-production.up.railway.app`) — no trailing slash. Used by `/api/kdp-pdf-check` and `/api/kdp-pdf-check-from-preflight`.
  - **NEXT_PUBLIC_KDP_PREFLIGHT_API_URL** = same URL. Used by the browser for **direct upload** when file > 4 MB (avoids Vercel body limit). If missing, large files get “Failed to fetch.”

### 2. **“Failed to fetch” on upload (file &lt; 100 MB)**

- **Symptom:** User selects e.g. 28 MB PDF, clicks Check, gets “Failed to fetch.”
- **Cause:** Files &gt; ~4.5 MB are sent through Vercel’s serverless body; Vercel has a **4.5 MB request body limit** that cannot be increased.
- **Fix (already in code):** Files &gt; 4 MB use **direct upload** to the Render preflight API when `NEXT_PUBLIC_KDP_PREFLIGHT_API_URL` is set. So:
  - Set **NEXT_PUBLIC_KDP_PREFLIGHT_API_URL** on Vercel (same as Render URL).
  - Ensure Render service is up and CORS allows the Vercel domain (engine uses `allow_origins=["*"]`).
- If direct upload still fails: check Render logs, CORS, and that the preflight `/upload` and `/health` are reachable from the browser.

### 3. **Timeouts**

- **Symptom:** Request hangs then fails; report never appears.
- **Cause:** Vercel serverless and browser have time limits. Preflight can take 30–120 s for large PDFs.
- **Mitigation:** Site already polls preflight status. If Vercel route timeout is hit (e.g. `/api/kdp-pdf-check` calling Render), consider increasing route `maxDuration` if on a plan that supports it, or rely more on **direct upload** from the client so the long work is between client and Render, not Vercel and Render.

### 4. **Build errors**

- **Symptom:** Vercel build fails.
- **Check:** Run `npm run build` locally in the repo root. Fix any TypeScript/ESLint errors and missing env (e.g. optional vars like preflight can be unset for build).

---

## Checklist

**Render**

- [ ] **REDIS_URL** set as Secret (Upstash URL with `?ssl_cert_reqs=CERT_NONE` if needed).
- [ ] **LOCAL_UPLOAD_DIR** = `/app/data/uploads` and disk mounted at `/app/data`.
- [ ] Root directory = `kdp-preflight-engine`, Dockerfile = `Dockerfile.live`.
- [ ] `GET /health` returns 200 and `{"status":"ok",...}`.

**Vercel**

- [ ] **KDP_PREFLIGHT_API_URL** = Render URL (no trailing slash).
- [ ] **NEXT_PUBLIC_KDP_PREFLIGHT_API_URL** = same Render URL (for direct upload &gt; 4 MB).
- [ ] Redeploy after changing env vars.

**End-to-end**

- [ ] Open checker page, upload a small PDF (&lt; 4 MB): should get full report (and visual if &lt; 4 MB via site).
- [ ] Upload a larger PDF (e.g. 20 MB) with preflight URL set: should get report via direct upload; no “Failed to fetch.”

---

## Quick diagnostics

| What you see | Likely cause | Action |
|--------------|---------------|--------|
| Render: build fails | Wrong root/Dockerfile or missing deps | Set root dir `kdp-preflight-engine`, use `Dockerfile.live`; check `requirements.txt`. |
| Render: crash after start | Redis/Celery connection | Check REDIS_URL; add broker SSL config if `rediss://`. |
| Render: 500 on /upload | Disk or permissions | Check disk mount and LOCAL_UPLOAD_DIR. |
| Render: first request very slow | Cold start | Expected on free tier; use /health pings or document. |
| Vercel: “Preflight not configured” | Env not set | Set KDP_PREFLIGHT_API_URL (and NEXT_PUBLIC_*) and redeploy. |
| Vercel: “Failed to fetch” on large file | Body limit or direct upload broken | Set NEXT_PUBLIC_KDP_PREFLIGHT_API_URL; verify Render is up and CORS allows origin. |
| Checker: only trim + page count | Preflight not called or down | Verify both env vars; hit Render /health from browser. |

---

*Last updated from codebase: Render blueprint, FastAPI/Celery/Redis, Vercel env usage, and 4 MB server vs direct-upload logic.*
