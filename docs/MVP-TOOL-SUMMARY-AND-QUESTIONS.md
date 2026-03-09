# MVP Tool — Summary, Components, Problems & Questions

**Purpose:** Single reference for the KDP PDF checker/formatter tool: what it is, how it works, recurring issues, proposed flows, pricing ideas, and open questions. Use this with Claude, ChatGPT, or internal review to get consensus and best practices before finalizing the product.

**Product name:** manu2print (LayoutForge). Live: manu2print.com.

---

## 1. Tool summary

**MVP = KDP PDF checker + path to a fixed PDF.**

- **Checker:** User uploads a PDF → we run ~26 KDP preflight rules (trim size, page count, margins, bleed, etc.) → user gets a **report** (pass/fail, issues list, recommendations) and, when possible, an **online PDF preview with marked annotations** showing where each issue is.
- **Formatter/fix:** Today we have (a) **DOCX → KDP PDF** (full formatting from Word) and (b) **PDF Print Optimizer** (e.g. compress/optimize). A **PDF-in → PDF-out “surgical fix”** (fix margins, bleeds, layout errors while keeping the rest intact) is the desired end state; exact scope for beta may be scan + report + “fix elsewhere” or a first version of auto-fix.
- **Paywall:** One payment (e.g. $7 per use or $27/6 months) gates **download(s)** — e.g. report + annotated PDF and/or the fixed/optimized PDF.

**User promise:** Upload your manuscript (PDF). We show you exactly what’s wrong for KDP and, in the target design, fix margins, bleeds, and common author mistakes (e.g. from Canva) while keeping your content intact — with an optimized preview (e.g. first 30 pages) and a “what we fixed” report, then paywall for the full optimized manuscript.

---

## 2. Components and flow (in sequence)

| # | Component | What it does |
|---|-----------|--------------|
| 1 | **Homepage / entry** | CTAs “Scan My PDF”, “See How It Works” → checker or formatter. |
| 2 | **KDP PDF Checker page** (`/kdp-pdf-checker`) | User selects PDF (drag/drop or file picker). Validation: PDF only, non-empty, &lt; 100 MB (display); &gt; 4 MB uses direct upload to preflight engine when configured. |
| 3 | **Upload path (≤ 4 MB)** | Browser → `POST /api/kdp-pdf-check` (Vercel). Vercel receives file (under body limit), stores it, calls preflight engine (Render) for validation, gets report, saves report + PDF by `id`, returns `id`. |
| 4 | **Upload path (&gt; 4 MB)** | Browser → `POST {PREFLIGHT_API}/upload` (direct to Render). No file to Vercel (avoids 4.5 MB limit). Engine stores PDF, runs validation, returns `job_id`. Browser polls engine status, then calls Vercel `POST /api/kdp-pdf-check-from-preflight` with `jobId` (no file). Vercel fetches report from engine, saves **placeholder PDF** + report, returns `id`. |
| 5 | **Preflight engine (Render)** | Docker app + Celery. Receives PDF (direct or from Vercel), runs validation (Redis + Celery), returns report with `page_issues` (page, rule_id, severity, message, bbox). Stores PDF on disk; **does not** expose it via HTTP today. |
| 6 | **Download page** (`/download/[id]?source=checker`) | Loads metadata + `processingReport`. Shows report (trim, page count, KDP ready Y/N, issues, recommendations). If `report.hasPdfPreview` and a PDF URL exists, shows **CheckerPdfViewer** with PDF + `page_issues` overlays (annotations). PaymentGate wraps download CTA. |
| 7 | **CheckerPdfViewer** | Needs `pdfUrl`, `pageIssues`, `totalPages`. Renders PDF and marks each issue (e.g. bbox) on the page. |
| 8 | **PaymentGate** | Checks access (payment_confirmed, beta code, or subscription via `verify-access`). If no access: blur/overlay, collect payment or beta code. If access: allow download. |
| 9 | **verify-access API** | Checks download `id` for payment_confirmed, or beta_access (email + tool), or active subscription. Returns allowed/not. |
| 10 | **Download API** (`/api/download/[id]/[filename]`) | Serves the file (report, annotated PDF, or fixed PDF) when access is granted. |
| 11 | **Formatter (DOCX)** | `/kdp-formatter` → DOCX upload → KDP PDF generation (trim, margins, etc.) → download. |
| 12 | **Formatter (PDF)** | `/kdp-formatter-pdf` (Print Optimizer) — e.g. compress/optimize PDF; separate from “surgical” PDF fix. |

**Critical path for beta:** Upload → preflight → report → (payment) → download → **viewer with annotations when PDF is available**.

---

## 3. Repeated problems

### 3.1 File size errors

- **Vercel serverless body limit ~4.5 MB.** Uploads larger than that cannot go through Vercel. We cap at 4 MB for the “through Vercel” path.
- **Current behavior:** Files ≤ 4 MB: go to Vercel → stored on site (ephemeral) → forwarded to engine. Files &gt; 4 MB: browser uploads **direct to Render**; Vercel never sees the file and only stores a **placeholder PDF** + report.
- **User-facing impact:** For &gt; 4 MB we show the report but **no PDF preview with annotations**, because the site has no PDF to serve (and the engine has no public `GET /file/{job_id}`).
- **Error messaging:** 413 (payload too large) or “upload failed” can be vague; we’ve improved copy but need consistent, clear messages (e.g. “File over 4 MB: we’ll check it but you won’t see the PDF with highlights; use PDF Compressor first if you want the full preview.”).

### 3.2 PDF previewer and marked annotations

- **When it works:** Only when the **site** has the real PDF: i.e. ≤ 4 MB via `/api/kdp-pdf-check`. Then `hasPdfPreview: true`, `pdfUrl = /api/view-pdf/{id}`, and CheckerPdfViewer shows the PDF with `page_issues` overlays.
- **When it fails:** For &gt; 4 MB (from-preflight flow): site has no PDF (only placeholder). Report has `hasPdfPreview: false`. Download page says: “For a visual report with highlights on each page, run the check with a file under 4 MB.”
- **Root cause (doc’d):** (1) Vercel limit; (2) by design we don’t send the large file to Vercel; (3) engine does not expose `GET /file/{job_id}` so the browser can’t load the PDF from Render.
- **Proposed fix (see KDP-PDF-CHECKER-ARCHITECTURE.md):** Engine adds `GET /file/{job_id}`; from-preflight stores `pdfSourceUrl` pointing at engine; download page uses that URL for the viewer so large files get the same annotated preview.

### 3.3 What the user must do to comply with Amazon KDP

From the report and recommendations we show:

- **Trim size:** Must match a KDP trim (e.g. 5.5×8.5", 6×9"). Report shows “Trim detected” and “Matches KDP trim.”
- **Page count:** 24–828 for KDP print. We report page count.
- **Margins / gutter:** Inner margin depends on page count (gutter). We can’t measure margins from the PDF; we show **recommended gutter** and tell the user to set inner margin ≥ 0.5" + gutter in their layout app (Word, Canva, etc.).
- **Bleed:** As per KDP (e.g. 0.125" bleed where required). Report can flag bleed issues.
- **File size:** KDP allows up to 650 MB; we warn if huge. Our own upload limit is 100 MB for the checker.
- **Other rules:** No weird/control characters, proper page breaks, consistent section breaks; images 300 DPI for print. Format Review (AI) and checker recommendations guide the user; the goal is to **fix** these in-app (surgical PDF fix) or by re-export from Canva/Word.

---

## 4. Proposed user flow (2 scans, 1 payment, 2 downloads)

**Idea to validate:**

1. **First scan (free or included):** User uploads PDF → gets **full report** + **first download: entire book with annotations/marks** showing where every correction is needed.
2. **User fixes errors** in their tool (Canva, Word, etc.) using that annotated PDF as a guide.
3. **User returns** and re-uploads a “corrected” PDF.
4. **Second scan / validation:** We run the same (or lighter) check. If pass → **second download: KDP-perfect, optimized PDF** ready for KDP.
5. **One payment** covers both downloads (annotated + final optimized).

**Open design questions:**

- Is the first “annotated” PDF the **same** PDF they uploaded with overlays drawn on it, or a new PDF we generate with visual marks burned in?
- Do we allow “re-upload and get fixed file” in one session (upload once → pay → get annotated + fixed), or always two separate uploads?
- Should “fix” be **we auto-fix** (surgical PDF) or **we only report and they fix elsewhere** until we build auto-fix?

---

## 5. Page-count pricing (tool-specific price points)

**Proposal to discuss:**

- Price by **page count** of the manuscript, e.g.:
  - 1–100 pages: $10  
  - 101–200 pages: $15  
  - 201–300 pages: $20  
  - 301–400 pages: $25  
  - (continue banding as needed)
- Rationale: Larger books = more processing, more value; aligns cost with use; minimum (e.g. 100 pages = $10) keeps a floor for very short books.

**Questions:**

- Should this **replace** the current $7 flat (or $27/6 months) for this tool, or be an **alternative** (e.g. “$7 flat or $10–$25 by page count”)?
- Do we charge on **first** upload page count or **final** (after re-upload)?
- How do we handle “second download only” (user already paid; comes back for the optimized file) — same link, same payment, or new purchase?

---

## 6. What might be missing (checklist)

- [ ] **Large-file preview:** Engine `GET /file/{job_id}` + `pdfSourceUrl` in from-preflight so annotations work for &gt; 4 MB.
- [ ] **Clear error copy** for 413 and upload failures (file too big, timeout, “use compressor first”, etc.).
- [ ] **Single, clear critical path:** Upload → report → (optional) annotated PDF download → (optional) re-upload → fixed PDF download, with one paywall.
- [ ] **PDF-in → PDF-out “surgical” fix:** Margins, bleed, trim, page size corrected automatically; content and design otherwise intact (Canva/Word mistakes fixed). May be post-beta.
- [ ] **Preview cap:** e.g. “First 30 pages” free/preview + “What we fixed” report; paywall for **full** optimized manuscript.
- [ ] **Page-count-based pricing** (if adopted): bands, minimum, and rules for re-upload/second download.
- [ ] **Retention/TTL:** How long we keep PDFs (Vercel ephemeral; engine persistent today). Optional: engine deletes files after 24–48 h.
- [ ] **Page numbers:** User mentioned “AI correct page numbers” as a possible standalone tool; then said “scrap that” — so not in MVP, but we could offer it later as a separate tool.

---

## 7. Platforms and tools needed (Vercel upgrade + rest)

- **Vercel:** Upgrading (e.g. Pro) can increase body limit and reduce cold starts; still, for very large PDFs, **direct upload to the engine** is the right pattern. So: upgrade for reliability and limits, but don’t rely on Vercel to receive 50 MB PDFs.
- **Render (preflight engine):** Must stay up; Redis (Upstash) for jobs. Add `GET /file/{job_id}` for large-file preview. Optional: temporary file retention (e.g. 24 h).
- **Supabase:** Auth, metadata, payments/subscriptions (Lemon Squeezy webhooks), beta_access, formatter_leads, email_captures.
- **Lemon Squeezy:** Payments and subscriptions; verify-access and PaymentGate already wired.
- **CloudConvert:** Used for some paid flows (e.g. DOCX/PDF); not for free PDF Compressor. Keep for any conversion-heavy formatter steps if needed.
- **Anthropic (Claude):** For Format Review (AI) and any future “smart” fix suggestions. Not required for the core checker; required for AI-driven features.

**To make the tool “work perfectly” for beta:**

1. Implement engine `GET /file/{job_id}` and site `pdfSourceUrl` for from-preflight so **all** files get annotated preview when possible.
2. Harden error messages (file size, timeouts, “compress first”).
3. Confirm one end-to-end path: upload (small or large) → report → payment → download (report + annotated PDF and/or fixed PDF) with viewer working for both flows.
4. Decide and implement pricing (flat vs page-count vs both) and what “2 downloads” mean in the UI and backend.

---

## 8. Vision (for consensus with Claude / ChatGPT)

**Core product:**

- User uploads **manuscript (PDF)**. We keep it **intact** but **fix** the specific KDP problems: margins, bleeds, trim, and other common mistakes from tools like Canva.
- **Preview:** e.g. first 30 pages of the **optimized** manuscript + a **downloadable report** of “what we fixed.”
- **Paywall:** After the AI/engine has scanned (and optionally fixed) the file, payment unlocks the **full optimized manuscript** download.
- **No separate “page number correction” tool in MVP** (can be a later standalone).

**Questions for consensus:**

1. **Flow:** Is “2 scans, 1 payment, 2 downloads” (annotated first, then re-upload → optimized) the right mental model, or should it be “1 upload → pay → get annotated + fixed in one go” when we have auto-fix?
2. **Pricing:** Flat ($7) vs page-count bands ($10–$25+) vs both; and how to handle second download (same purchase or new).
3. **Large files:** Agree that engine must serve PDF for viewer (`GET /file/{job_id}`) and site must pass `pdfSourceUrl` for from-preflight?
4. **Preview:** “First 30 pages optimized + report of fixes” before paywall — good default?
5. **Auto-fix scope for beta:** Report only, or report + first version of surgical PDF fix (margins, bleed, trim)?

---

## 9. Confirmation

- **MVP:** KDP PDF checker (scan + report + annotated preview when we have the PDF) + path to a fixed/optimized PDF (re-upload or auto-fix), with one paywall for download(s).
- **Repeated issues:** File size (4.5 MB Vercel limit, &gt; 4 MB no preview); PDF viewer needs a URL (engine must serve PDF for large files); annotations = `page_issues` in CheckerPdfViewer.
- **User compliance:** Report + recommendations + (when we have it) surgical fix so they meet KDP trim, page count, margins, gutter, bleed, file size.
- **This doc:** Use as the single runnable summary for Claude, ChatGPT, or team to align on flow, pricing, and best practices before locking the app.
