# Product facts (for AI support / writer)

Short, updatable reference. Pass this (or the current version) into the support prompt so answers stay accurate. Update when tools or limits change.

---

## Site

- **Product:** manu2print — tools for indie authors / Amazon KDP.
- **Site:** https://www.manu2print.com (or your deployment URL).

---

## File limits and formats

| Context | Limit / format |
|--------|-----------------|
| **PDF uploads** (Compressor, PDF Print Optimizer, keyword/description PDF) | Max **50 MB**. PDF only. |
| **Print Ready Check (KDP PDF Checker)** | Max **100 MB**. PDF only. |
| **DOCX uploads** (KDP Formatter, 7 Keyword Research DOCX, Description Generator DOCX) | Max **50 MB**. DOCX only. |
| **KDP PDF (final)** | KDP allows up to 650 MB; Print Ready Check accepts interiors up to **100 MB**. Page count max **828** for KDP. |
| **Download links** (checker report, annotated PDF presigned URLs) | **24 hours** — save files locally; use https://www.manu2print.com/resend-link if the link expired. |

---

## Tools (name → what they do)

**Free**

- **PDF Compressor** — Shrink PDFs up to 50 MB. No account needed. `/pdf-compress`
- **PDF Print Optimizer** — Shrink / print-optimize PDF. `/kdp-formatter-pdf`
- **KDP Royalty Calculator** — Earnings by page count, trim, list price. `/royalty-calculator`
- **Page Count Estimator** — Interior pages from word count and trim size. `/page-count-estimator`
- **Trim Size Comparison** — Print cost and royalty across trim sizes. `/trim-size-comparison`
- **Spine width calculator** — Spine and full-wrap cover dimensions. `/spine-calculator`
- **Full-wrap cover calculator** — Cover size in inches and 300 DPI pixels. `/cover-calculator`
- **Banned keyword checker** — Risky words in title/subtitle/description. `/banned-keyword-checker`
- **Kids book trim guide** — Trim sizes and page counts for picture books. `/kids-trim-guide`

**Paid** (pay per use or 6‑month pass)

- **KDP Formatter (DOCX)** — Format DOCX for KDP print → print-ready PDF. `/kdp-formatter`
- **7 Keyword Research (DOCX)** — 7 KDP keyword phrases from DOCX. `/keyword-research`
- **Amazon Description Generator (DOCX)** — Book description, author bio, BISAC. DOCX only. `/description-generator`
- **KDP PDF Checker** — Check PDF against KDP specs. `/kdp-pdf-checker`
- **7 Keyword Research (PDF)** — 7 KDP keyword phrases from PDF. `/keyword-research-pdf`
- **Amazon Description Generator (PDF)** — Listing package from PDF. `/description-generator-pdf`
- **Kindle EPUB Maker** — Manuscript to Kindle-ready EPUB. `/epub-maker`

---

## Common fixes

- **Upload fails / “won’t upload”** — Often wrong format or file over the tool limit (most PDF/DOCX tools: 50 MB; **KDP PDF Checker:** 100 MB). Use standard PDF or DOCX; re-export if needed; keep images ~300 DPI for print.
- **Wrong format error** — DOCX tools accept only .docx; PDF tools accept only .pdf. Export from the app (e.g. Word “Save As” DOCX, or “Export as PDF”).
- **Description generator** — DOCX version: DOCX only. PDF version: PDF only. Check the tool page for which input it expects.

---

**Bot:** The in-product AI assistant is **Manny**. It uses this file plus `docs/FAQ-FOR-BOT.md` and the persona in `docs/UI-AND-BACK-OFFICE.md` §6.4–6.6. See `docs/AI-ASSISTANT-NAME-AND-SETUP.md`.

*Update this file when you add tools, change limits, or change URLs.*
