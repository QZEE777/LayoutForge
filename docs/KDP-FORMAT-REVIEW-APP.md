# KDP Format Review (standalone app) — breakdown

## What it is

A **standalone, monetizable tool** on manu2print: the user gives you their manuscript (paste or upload); an AI reviews it as a professional KDP formatter and returns a **structured format report** (margins, spacing, headings, lists, KDP rules). No Cursor, no copy‑paste into chat — everything happens inside your app, behind your paywall.

---

## What it does (doable features)

| Feature | Description |
|--------|-------------|
| **Input** | User **pastes text** and/or **uploads DOCX or PDF**. You already have PDF→text and DOCX extraction (CloudConvert + pdf-parse / docx) in the stack. |
| **AI review** | One (or a few) calls to an LLM with a fixed “KDP formatter” prompt. The model returns a **structured report**: sections for Margins/gutter, Spacing, Headings, Lists, KDP rules, plus a short summary. |
| **Report** | Show a clear, scannable report: “Margins & gutter”, “Spacing”, “Headings”, “Lists”, “KDP rules”, “Summary” with **issues** and **recommendations** (bullet points). Optional: **page-count estimate** from word count and your existing `getGutterInches(pageCount)` so you can say “For ~X pages, use Y″ gutter.” |
| **Monetization** | Same as KDP PDF Checker: **$7 per use** or **$27 for 6 months**. Gate the “Run review” action behind your existing payment/verify-access flow. |

No need for “AI writes the book” or heavy editing — just **review + report**. That keeps scope small and cost predictable.

---

## Which AI to use

**Recommendation: Anthropic (Claude).**

- You already use **Claude** for keyword research and description generator (`ANTHROPIC_MODEL` in the codebase). One vendor, one key, one bill.
- **Model choice:**  
  - **Claude Haiku** (e.g. `claude-haiku-4-5-20251001`): cheap, fast, good enough for a structured format review.  
  - **Claude Sonnet**: better nuance and explanation if you want a “premium” feel; higher cost per request.
- **Why not add OpenAI (GPT-4) for this:** You can, but it adds a second API key, second billing, and more moving parts. Claude alone is enough for this feature.

**Rough cost (Haiku):** A few cents per review (e.g. 50k input + 1k output). Fits easily inside a $7/use price.

---

## High-level flow

1. User lands on **“KDP Format Review”** (new page, e.g. `/kdp-format-review`).
2. User either **pastes manuscript text** or **uploads DOCX/PDF**. If upload: you extract text (existing pipelines); if paste: use as-is. Optionally cap input (e.g. 100k characters) to control cost.
3. User clicks **“Run review”**. You check access (paywall: $7 or $27/6mo). If not paid, show paywall; if paid, continue.
4. Backend: build a **single prompt** (system + user). System: “You are a professional KDP formatter. Review the following manuscript for … Return a structured report with these sections: …” User: the manuscript (truncated if needed).
5. Call **Anthropic API** (Haiku or Sonnet). Parse the reply (markdown or JSON if you ask for structured output).
6. Save the **report** (e.g. in `processingReport` or a small “reviews” store), redirect to a **report page** (e.g. `/download/[id]?source=format-review` or `/format-review/[id]`).
7. Report page shows: **Margins & gutter**, **Spacing**, **Headings**, **Lists**, **KDP rules**, **Summary**, plus optional **page-count estimate + recommended gutter** from `getGutterInches`.

---

## What the report contains (example sections)

- **Margins & gutter** — Whether the text suggests adequate inner margin; recommended gutter for estimated page count (from your existing logic).
- **Spacing** — Double/single spacing, spacing around headings, consistency.
- **Headings** — Use of styles, hierarchy (e.g. chapter vs section), KDP-friendly structure.
- **Lists** — Bullets/numbering, indentation, consistency.
- **KDP rules** — General compliance (no weird characters, page-break issues, etc.), plus 1–2 sentence summary.
- **Summary** — 2–3 bullet “Top actions” so the user knows what to fix first.

All of this is **doable with one strong prompt** and a single LLM call (or two if you split “structure” vs “rules”).

---

## Tech summary

| Item | Choice |
|------|--------|
| **AI** | Anthropic Claude (Haiku for cost, Sonnet for quality). |
| **Input** | Paste + optional DOCX/PDF upload using existing extraction. |
| **Output** | Structured format report (sections above); optional page-count + gutter. |
| **Monetization** | $7 per use / $27 for 6 months, same as KDP PDF Checker. |
| **New pieces** | One new page (upload/paste + “Run review”), one new API route (prompt + Anthropic call + save report), one report view. Reuse verify-access, payment gate, and (if you want) download-style layout. |

---

## One-line pitch

**“Paste or upload your manuscript — get an AI format review for margins, spacing, headings, lists, and KDP rules, in one click.”** Sold as a standalone, paid tool alongside your existing KDP Checker and formatters.
