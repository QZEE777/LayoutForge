# Early morning to-do list

Use this as your daily/session checklist for manu2print.

## Done ✓

- [x] **Royalty Calculator** — Live. Trim, page count, list price → royalty (60% / 35%).
- [x] **FREE tools in top row** — Formatter page: FREE tools (PDF Compressor, PDF Print Optimizer) in first row.
- [x] **"FREE" badge** — Caps, bold, green on free-tool app boxes.
- [x] **Placeholders for mini projects** — Mini tools section: Royalty Calculator (live), Page Count Estimator (coming soon), Trim Size Comparison (coming soon).

## Next / when you have time

- [ ] **KDP Format Review** — Paste/upload → AI review + optional preview (see `docs/KDP-FORMAT-REVIEW-APP.md`).
- [ ] **Checker add-ons** — Bleed check, DPI note (see `docs/KDP-PDF-CHECKER-ADDONS.md`).
- [ ] **Color / children’s book angle** — See `docs/COLOR-AND-CHILDRENS-BOOKS.md`.
- [ ] **Page Count Estimator** — Word count + trim → estimated pages (can use `estimatePageCount` from `kdpSpecs`).
- [ ] **Trim Size Comparison** — Compare print cost and royalty across trim sizes.

## Reference

- Formatter page: `src/app/formatter/page.tsx`
- Royalty calc: `src/app/royalty-calculator/page.tsx`, `src/lib/royaltyCalc.ts`
- FREE tools: PDF Compressor (`/pdf-compress`), PDF Print Optimizer (`/kdp-formatter-pdf`)
