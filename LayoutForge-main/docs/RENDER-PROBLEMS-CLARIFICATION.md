# App render vs original — problems clarified

## What the images show

| Image | Source | What it is |
|-------|--------|------------|
| 1 | DOCX app render | Our output: "PRIMAL BALANCE" (faded/centered?), then **"Front Matter" as a chapter heading**, then title block, publisher, dedication as plain paragraphs |
| 2 | PDF app render | Three lines only: By Lemo Lemessy, Published by ZenGlow Media, © 2026 |
| 3–4 | Original DOCX | **One designed page**: CHAPTER 1, line, "Front Matter" (big centered), PRIMAL BALANCE / BLUEPRINT, **thick black bar**, Lemo Lemessy (centered italic), subtitle, By Lemo Lemessy, publisher |
| 5 | Original DOCX | TOC: "Table of Contents", SECTION I / SECTION II, chapters with em dash and wrapping |
| 6 | Original DOCX | Body: "A Note on Labs" (centered bold), "Your Body's Dashboard" (centered italic), justified body |

---

## Problem 1: Manuscript front matter rendered as a body chapter

- **Original:** The first page is a single **title/front matter page**: CHAPTER 1, "Front Matter", book title, bar, author, subtitle, publisher. One layout, mixed alignment and styles.
- **App:** We generate **our** title page from config (e.g. "PRIMAL BALANCE", "By Lemo Lemessy") and then we **also** output a **body chapter** titled **"Front Matter"** whose "paragraphs" are: PRIMAL BALANCE, BLUEPRINT, The Proven Path…, Published by…, Dedication, dedication text, etc.
- So the manuscript’s front matter is **not** treated as front matter; it’s parsed as the first chapter and printed again in the body with one heading and left‑aligned paragraphs. Result: duplication, wrong hierarchy, and loss of the original layout (centered, bars, bold/italic).

**Cause:** The **app invents** the label "Front Matter": the parser gives that default title to the first bucket (everything before the first CHAPTER/Heading 1). The original DOCX need not contain the text "Front Matter" at all. The generator used to render that bucket as a body chapter, so the invented heading appeared in the output. **Fix:** Parser now uses an empty title for that bucket; generator skips any chapter with an empty title so it is never rendered.

---

## Problem 2: Vertical bar / pipe before "PRIMAL BALANCE"

- In the app DOCX there is a **vertical black line or pipe** before the "P" in "PRIMAL BALANCE".
- That is either:
  - A **character in the source** (e.g. `|` or a similar Unicode character) that we’re faithfully passing through, or
  - A **rendering artifact** from our generator (e.g. bad character or control code).
- We don’t sanitize paragraph text, so any pipe or special character in the DOCX will appear in the output.

---

## Problem 3: Layout flattened to one template

- **Original:** Centered titles, horizontal lines (thin and thick), bold/italic mix, SECTION I/II in TOC, title + italic subtitle for sections.
- **App:** One font, one alignment (left for body), one heading style. No lines, no centering, no SECTION grouping in TOC.
- So we **intentionally** don’t preserve the original design; we apply a single template. That’s a product choice, but it’s why the app output never looks like the original’s front matter or TOC.

---

## Problem 4: PDF shows only three lines (Image 2)

- PDF snippet shows only: By Lemo Lemessy, Published by ZenGlow Media, © 2026.
- So either:
  - The PDF is many pages and we’re only seeing one (e.g. our generated title/copyright page), or
  - The PDF generator is **not** outputting the rest of the content (bug).
- Needs a quick check: open full PDF and see if body and "Front Matter" chapter are present or missing.

---

## Problem 5: TOC doesn’t match original

- **Original:** "Table of Contents", SECTION I, SECTION II, then chapter lines with em dash and wrapped titles.
- **App:** We build TOC from parsed **chapters** (Heading 1 only). If "Front Matter" is chapter 1 and SECTION I/II are H2 or not detected, we get a different structure (e.g. "Front Matter" as first TOC entry, no SECTION I/II). So section grouping and exact formatting differ.

---

## Summary

| # | Problem | Cause |
|---|---------|--------|
| 1 | Manuscript front matter appears as a body chapter | We don’t skip or merge chapter titled "Front Matter"; it’s rendered as body. |
| 2 | Pipe/vertical bar before title | Stray character in text; no sanitization of runs. |
| 3 | All layout flattened | By design: one template, no preservation of original layout. |
| 4 | PDF only three lines? | Either one page shown or PDF generator omitting content. |
| 5 | TOC different from original | We only use H1 chapters; no SECTION grouping; different structure. |

**Next steps (implementation):**  
- Treat a first chapter titled "Front Matter" (or "CHAPTER 1" when it’s clearly front matter) as **not** body: skip from body output and optionally use its text for dedication/copyright if needed.  
- Sanitize paragraph text (e.g. strip or replace `|` and control characters) so the pipe artifact goes away.  
- Confirm PDF: ensure full document is generated and not truncated.
