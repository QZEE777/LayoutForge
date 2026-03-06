# KDP PDF Checker — Add-ons Plan

## What’s in the checker now

- **Trim size** — Page dimensions vs KDP trim list (5×8, 5.5×8.5, 6×9, etc.)
- **Page count** — Min 24, max 828 (KDP limits)
- **File size** — Warn if > 650 MB
- **Report** — Issues + recommendations; stored and shown behind paywall

---

## Suggested add-ons (priority order)

### 1. One-click “KDP Ready” badge (trust builder) — **Easy**

- Add a single **pass/fail** at the top of the report: **“KDP Ready: Yes”** or **“KDP Ready: No — 3 issues”**.
- Derive from `issues.length === 0`.
- Optional: **“Download report”** as .txt (one-click summary for their records).

**Why first:** Fast to ship, clear value, strong trust signal.

---

### 2. Margin guidance (based on page count) — **Easy**

- We already have `getGutterInches(pageCount)` in `kdpConfig`.
- Add to the report:
  - **“Recommended gutter (inner margin) for your page count: X inches.”**
  - Short line: *“We can’t measure margins from the PDF; in Word/InDesign set inner margin ≥ 0.5" + gutter.”*

**Why:** Addresses “margin validation” in a way we can do without measuring the PDF.

---

### 3. Bleed + trim verification — **Medium**

- **Bleed:** KDP expects 0.125" bleed when art goes to the edge. Try to detect:
  - Media box vs crop/trim (if available in the PDF) **or**
  - Heuristic: “If you have full-bleed art, ensure 0.125" bleed in your export.”
- **Trim:** Already done (trim size check).
- If the library exposes media/crop box, add: *“Bleed: detected / not detected (OK if no full-bleed art).”*

**Why:** Directly tied to KDP compliance; many authors get this wrong.

---

### 4. Minimum page count — **Done**

- Already validated: page count 24–828. No extra work.

---

### 5. Image DPI validation (300 DPI warning) — **Medium**

- Need to find images in the PDF and compare **pixel size** vs **display size** on the page to infer effective DPI.
- pdf-lib is weak for “list images and their display size”; may need **pdf.js** (Mozilla) or raw PDF parsing.
- Add-on: *“Images below 300 DPI: N”* or *“We couldn’t check image DPI; ensure images are 300 DPI at final size.”*

**Why:** Very common KDP rejection reason; worth doing once we have a reliable way to read image + display size.

---

### 6. Font embedding check — **Hard**

- Requires knowing which fonts are used and whether they’re embedded (no substitution).
- pdf-lib doesn’t expose “list fonts and embedding status” for an existing PDF.
- Options: raw PDF parsing of Font descriptors, or a library that reports font embedding.
- Add-on: *“Fonts embedded: Yes/No/Unknown.”*

**Why:** Important for print; implement after DPI and bleed if we find a clean API.

---

### 7. Color space (RGB vs CMYK) — **Hard**

- Need to read color space of images and/or text from the PDF.
- pdf-lib doesn’t expose this for loaded PDFs.
- Would need low-level PDF parsing or a specialist library.
- Add-on: *“Color: RGB detected; for print consider CMYK”* or *“Color: CMYK”*.

**Why:** Nice to have for pros; lower priority than DPI and bleed.

---

## Implementation order

| Order | Add-on                     | Effort | Impact        |
|-------|----------------------------|--------|---------------|
| 1     | “KDP Ready” badge + optional download report | Easy   | Trust, clarity |
| 2     | Margin guidance (gutter by page count)        | Easy   | Compliance    |
| 3     | Bleed verification (if we can read media/crop)| Medium | Compliance    |
| 4     | Image DPI (with pdf.js or similar)            | Medium | Compliance    |
| 5     | Font embedding                               | Hard   | Compliance    |
| 6     | Color space                                  | Hard   | Pro/print     |

---

## Summary

- **Do first:** “KDP Ready” one-click report (badge + optional .txt download) and margin guidance from page count. Both are easy and align with “one-click KDP Ready report” and “margin validation.”
- **Then:** Bleed/trim wording (and detection if the PDF exposes it), then image DPI once we have a reliable reader.
- **Later:** Font embedding and color space when we have or add the right parsing.

This keeps the checker as a clear trust builder while layering in the validations you care about most.
