# Manu2Print KDP

**One template. One pipeline. KDP-ready.**

---

## What it is

- **Product:** Format a manuscript DOCX for Amazon KDP print (and use the same file for Kindle Create if you want).
- **Input:** One DOCX (max 50MB).
- **Output:** Review DOCX + final PDF. Same content, one consistent layout.

## How it works

1. **Upload** your DOCX.
2. **Configure** title, author, trim size (e.g. 6×9), optional TOC/copyright.
3. **Download** review DOCX and/or PDF.

**Template (no options):**

- **One font:** Times New Roman (body + headings).
- **One spacing:** Single line, one paragraph space after.
- **One heading style:** Chapter (H1), section (H2), subsection (H3) — same font, bold, clear size.

Structure comes from your document:

- **Word styles:** Heading 1 → chapter, Heading 2 → section, Heading 3 → subsection.
- **Or** lines starting with `CHAPTER 1` / `SECTION 1` (or roman) when “Already KDP-ready” is **not** checked.
- **Already KDP-ready:** When checked, only Word Heading 1/2/3 define structure; we don’t promote any paragraph to a heading.

Content is preserved: we read `word/document.xml` directly (no Mammoth). Every paragraph is kept; only stray 1–3 digit lines (e.g. page numbers) are dropped.

## What we don’t do (yet)

- No AI formatting. One rules-based template only.
- No pass-through of your original formatting. We always rebuild with the one template.
- No EPUB/Kindle export in-app; use the DOCX with Kindle Create or other tools.

## Tech

- **Parser:** `src/lib/kdpDocxParser.ts` — JSZip, OOXML, preserve all paragraphs.
- **Generator:** `src/lib/kdpDocxGenerator.ts` — docx package, one font/spacing/heading set.
- **Routes:** `/api/kdp-format-docx-preview` (DOCX), `/api/kdp-format-docx` (PDF).

---

*Shipped product = this one template. Smart Format (AI plan) = future premium.*
