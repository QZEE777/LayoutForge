# KDP Preflight — React Frontend

Minimal React app that uploads a PDF to the KDP Preflight API, polls for the validation report, and displays the PDF with error/warning overlays.

## Features

- **Upload** — Choose a PDF; upload with progress; backend returns `job_id`.
- **Polling** — Polls `GET /status/{job_id}` until status is `completed` or `failed`.
- **Report** — Fetches `GET /report/{job_id}` and shows PASS/FAIL summary.
- **PDF viewer** — Renders the uploaded PDF (same file in memory) with **PDF.js** via `react-pdf`.
- **Overlays** — Draws rectangles on each page from `page_issues[].bbox`:
  - **Red** stroke = `ERROR`
  - **Yellow/amber** stroke = `WARNING`
- **Page navigation** — Previous/next page.
- **Error panel** — Lists issues by page in a sidebar.

## API base URL

Configure the backend base URL with an environment variable:

1. Copy `.env.example` to `.env` in the `frontend` directory.
2. Set:
   ```bash
   VITE_API_URL=http://localhost:8000
   ```
   Use the URL where your KDP Preflight API runs (no trailing slash). If you leave it empty, the app uses the same origin.

Restart the dev server after changing `.env`.

## Bbox coordinate mapping

The API returns each issue with a `bbox` in **PDF points** (72 points = 1 inch):

- Format: `[x, y, width, height]` (top-left origin).
- The viewer scales these to the **rendered page size** so boxes align with the PDF:

```ts
// PDF page dimensions in points (from PDF.js getViewport({ scale: 1 }))
const widthPt = viewport.width;
const heightPt = viewport.height;

// Rendered size in pixels (we fix width, height scales by aspect ratio)
const renderWidth = 600;  // px
const scaleX = renderWidth / widthPt;
const scaleY = scaleX;    // same scale for both axes
const displayHeight = heightPt * scaleX;

// Map bbox (points) to SVG (pixels)
const [x, y, w, h] = issue.bbox;  // points
rect.x      = x * scaleX;
rect.y      = y * scaleY;
rect.width  = w * scaleX;
rect.height = h * scaleY;
```

So: **scale = (rendered width in px) / (PDF page width in points)**. Use the same scale for x and y to preserve aspect ratio. When you add zoom later, use `scale = (renderedWidth * zoom) / widthPt`.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Ensure the backend is running (e.g. `uvicorn app.main:app --port 8000` and a Celery worker) and `VITE_API_URL` points to it.

## Build

```bash
npm run build
```

Output is in `dist/`. Serve with any static host; set `VITE_API_URL` at build time for the production API URL.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **react-pdf** (PDF.js) for rendering PDFs
- Fetch for API calls; XHR for upload progress
