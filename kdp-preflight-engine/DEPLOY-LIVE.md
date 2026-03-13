# Deploy KDP Preflight Engine — LIVE

Get the 25-rule PDF checker running in production so the manu2print KDP PDF Checker uses it.

## 1. Redis (already have it)

You use **Upstash** (e.g. `rediss://default:...@....upstash.io:6379?ssl_cert_reqs=CERT_NONE`). Keep that.

## 2. Deploy API + worker (Render)

1. Go to [render.com](https://render.com), sign in, **New → Blueprint**.
2. Connect the **LayoutForge** repo.
3. Set **Root Directory** to `kdp-preflight-engine`.
4. Render will read `render.yaml`. Ensure:
   - **REDIS_URL**: Add as Secret (your Upstash URL with `?ssl_cert_reqs=CERT_NONE`).
   - **LOCAL_UPLOAD_DIR** is set in the YAML (`/app/data/uploads`).
   - Disk is mounted at `/app/data` (persistent uploads).
5. Deploy. Note the service URL (e.g. `https://kdp-preflight-api.onrender.com`).

## 3. Wire the live site (Vercel)

1. Vercel → your LayoutForge project → **Settings → Environment Variables**.
2. Add **KDP_PREFLIGHT_API_URL** = your Render service URL (e.g. `https://kdp-preflight-api.onrender.com`). No trailing slash.
3. Redeploy the Next.js app (or push to `main`).

After that, **KDP PDF Checker** on layout-forge.vercel.app will use the full preflight engine when users upload a PDF. If the preflight API is down or times out, the site falls back to the basic (trim + page count) check.

**CORS:** The engine sends `Access-Control-Allow-Origin: *` (and OPTIONS handling for `/upload`). If you change CORS in `app/main.py`, **redeploy the Render service** so the live URL returns these headers; otherwise direct browser→Render uploads can fail with a CORS error. The site currently uses the Vercel **upload-proxy** for large files (4–4.5 MB) to avoid CORS; files over 4.5 MB are rejected by the proxy until/unless direct upload to Render is re-enabled.

## Optional: Railway

- New Web Service, connect repo, **Root Directory** = `kdp-preflight-engine`, **Dockerfile path** = `Dockerfile.live`.
- Add env: **REDIS_URL**, **LOCAL_UPLOAD_DIR** = `/app/data/uploads`.
- Add a volume and mount at `/app/data` if Railway supports it (so uploads persist across restarts).
