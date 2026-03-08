# Kimi design prompt — morning polish & styling run

Use this prompt with Kimi (or another design-focused agent) for **one design pass** on the manu2print homepage. Goal: **polish and styling only** — no copy rewrites, no new sections, no feature changes.

---

## Prompt to paste into Kimi

```
You're doing a single design pass on the manu2print homepage for polish and styling.

**Context**
- Product: manu2print — tools for indie authors publishing on Amazon KDP (print + Kindle).
- Audience: Authors who want to check/fix/prepare their PDF or manuscript before uploading to KDP; avoid rejection, save time, publish with confidence.
- Brand: "manu" (serif) + "2print" (sans); brave orange (#FB542B) as primary CTA; amazon-navy for text; ivory/arctic backgrounds. Bebas for headings. Trust, clarity, no fluff.

**Content to style (do not change copy or structure)**
- Nav: Tools, How It Works, Pricing, About, Check My PDF; logo manu2print.
- Hero: PDF + bullseye graphic first (above fold); single CTA = glossy orange round "Check My PDF" button inside bullseye; headline "Turn Your Manuscript Into a Print-Ready Book"; subtext about check/fix/prepare for KDP.
- Problem block: "KDP rejection hurts" — short paragraph.
- Toolkit: grid of tool cards (Print Ready Check primary/orange; PDF Compressor, PDF Print Optimizer live/blue; DOCX and others "Coming Soon"). Same card block, centered text, 3-line descriptions.
- Free tools: 6 cards (compress, royalty, page count, trim comparison, spine, full-wrap cover). Same card style, blue/available.
- How it works: 3 steps — Upload PDF → We analyze (26 rules) → See what to fix.
- Why authors use us: 3 benefits (Avoid rejection, Save hours, Publish with confidence).
- Testimonials: 3 placeholder cards ("What Authors Are Saying").
- Trust line: files processed securely, never stored; no subscription.
- Marquee: "Trusted by indie authors on Amazon KDP" etc. on navy.
- Comparison table: manu2print vs Vellum, Atticus, other (placeholder).
- Final CTA: "Ready to See if Your Book Will Pass KDP?" + Check My PDF button.
- Footer: logo, legal/terms/privacy/about/FAQ/contact/tools links, secure processing line, © 2026.

**Your task**
- Suggest **styling and polish only**: spacing, typography hierarchy, shadows, borders, hover states, color contrast, responsive tweaks, visual rhythm. Keep all existing copy and section order.
- Output concrete CSS/Tailwind-style suggestions or component-level tweaks we can apply in Next.js (Tailwind). No new sections, no copy changes, no new features.
- If something feels visually off (e.g. hero too dense, cards too flat, CTA not standing out enough), suggest minimal changes that stay on-brand.
```

---

## After Kimi responds

1. Review the suggestions in this project (LayoutForge).
2. Apply the ones you want in `src/app/page.tsx` (and any global styles/tailwind if needed).
3. Run a quick pass: lint, then push with the usual sequence (see `docs/ROE-PROTOCOL.md` §3).
