# KDP PDF Checker — Annotation pipeline (preview, download, email)

**Purpose:** One place describing how highlights and the annotated PDF stay aligned.

## Severity → colour (critical vs warning)

| Layer | Critical | Warning |
|--------|----------|---------|
| **Download page preview** (`CheckerPdfViewer`) | `CHECKER_OVERLAY_CRITICAL_HEX` (`#FF0000`) | `CHECKER_OVERLAY_WARNING_HEX` (`#FF8C00`) |
| **Preflight annotated PDF** (`kdp-preflight-engine/app/tasks/annotate_pdf.py`) | RGB `(1, 0, 0)` | RGB `(1, 0.55, 0)` ≈ `#FF8C00` |

**Normalisation** (must match between TS and Python):

- Treat `severity` in `{ critical, error, advanced }` as **critical**.
- If `rule_id` mentions margin, bleed, trim, `page_size`, treat as **critical** (layout-breaking).
- Otherwise **warning**.

TS: `CheckerPdfViewer` → `normalizeSeverity`.  
Python: `_normalize_severity` in `annotate_pdf.py`.

Green is **not** drawn on manuscript pages — only red/orange rectangles. Green appears on the **PDF summary page** (score ring, “Passed Checks” stat, PASS label).

## Pass / score threshold

Site and preview use **`CHECKER_ANNOTATION_PASS_THRESHOLD`** (95) from `src/lib/checkerAnnotationStyle.ts` (download page re-exports it as `KDP_DISPLAY_PASS_THRESHOLD`).

The annotated PDF summary page reads **`pass_threshold`** from the annotate JSON body (default 80 if omitted for older clients). The worker and sync route send **95** so PASS / score ring match the web UI.

## POST `/annotate/{job_id}` body (LayoutForge → engine)

Built by `src/lib/checkerAnnotatePayload.ts` → `buildCheckerAnnotateReportBody`:

| Field | Meaning |
|--------|---------|
| `page_issues` | Same shape as preflight `page_issues` (page, rule_id, severity, message, bbox). |
| `score` | 0–100, same as `readinessScore100` after enrichment. |
| `total_checks` | `preflight.summary.rules_checked` or **26**. |
| `passed_checks` | `max(0, total_checks - error_count - warning_count)` from preflight summary. |
| `pass_threshold` | **95** (must match site). |
| `display_filename` | Optional; shown top-right on summary page instead of raw job UUID filename. |

## End-to-end flow

1. **Worker** (`printReadyCheckProcess`) uploads PDF to preflight, polls report, saves meta, then `POST …/annotate/{renderJob_id}` with the body above. Engine writes **annotated PDF** to R2, returns `r2_key`.
2. **LayoutForge** stores `annotatedPdfDownloadUrl` (presigned GET) when `USE_R2=true`.
3. **Preview** uses **original** PDF via `pdfSourceUrl` → `/api/r2-file?id=…` + **overlays** from `format-report` `page_issues` (same severities as annotate).
4. **Download / email** use the **same** R2 annotated file (`annotatedPdfDownloadUrl`). Email is a **link**, not an attachment (`sendAnnotatedPdfReadyEmail`).

## Download link lifetime (reports + annotated)

Presigned GET URLs use **`DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS`** in `src/lib/r2Storage.ts` (**24 hours**). Customer-facing copy (download page, `resend.ts` emails, FAQ) should stay aligned with that constant.

## Deploy notes

- **LayoutForge** (Vercel): ships TS changes (`checkerAnnotatePayload`, worker bundle via Railway worker from same repo).
- **Preflight engine** (Railway/elsewhere): must redeploy when **`annotate_pdf.py`** changes, or summary page will keep old pass-threshold behaviour.
