# Color in books & children's books — value and KDP

Short note for future product ideas. No code changes; reference only.

---

## Interior color (KDP)

- **Black & white interior:** Standard; one price tier.
- **Color interior:** KDP supports it; different pricing (higher print cost). Trim sizes and page count rules still apply; color PDFs should be CMYK or at least print-ready (300 DPI images).
- **Value for us:** A "Color interior checklist" or "Is my PDF ready for KDP color?" could sit alongside the existing PDF Checker (e.g. "Color detected: ensure images are 300 DPI and CMYK for best print").

---

## Children's books

- **Trim sizes:** KDP offers specific trim sizes popular for kids (e.g. 8.5×8.5, 8×10). Our trim list in `kdpConfig` can be extended if we add child-specific flows.
- **Interior:** Often full color, heavy images, simple text. Requirements: 300 DPI images, bleed (0.125") if art goes to edge, safe margins so text/important art isn’t in the gutter.
- **Value for us:**
  - **Children’s book PDF Checker** variant: same as current checker plus “image DPI / bleed / safe zone” hints.
  - **Format Review** (when we build it) could have a “Children’s book” mode: AI checks for simple language, consistent spacing, image-heavy structure, and reminds about 300 DPI and bleed.
  - **Templates or presets:** e.g. “Children’s 8.5×8.5” with preset gutter and margins in the DOCX/PDF formatter.

---

## Spot color / professional print

- IngramSpark and offset printers often use **spot color** (Pantone) or **CMYK**. KDP is mostly digital print (CMYK simulated). If we ever add IngramSpark or “pro print” tools, color space (RGB vs CMYK vs spot) and bleed become first-class.

---

## Summary

- **Color:** KDP supports color interior; we can add “color-ready” guidance (DPI, CMYK) to the checker or a future Format Review.
- **Children’s books:** High value segment; trim sizes, color, DPI, bleed, and safe margins. Good fit for a checker variant or Format Review “children’s” mode.
- **Next steps (when prioritised):** Extend checker or add a “children’s” preset; add color/DPI to the checker add-ons list; or keep this doc as a backlog for when we do Format Review or IngramSpark.
