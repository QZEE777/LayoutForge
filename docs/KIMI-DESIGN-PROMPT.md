# Kimi Design Brief — manu2print Homepage Polish & Upscale

**Purpose:** This is the final design pass. You are optimizing and polishing the visual design only. All structure, content, copy, functionality, and technical integrity must remain untouched.

---

## 1. Context

- **Product:** manu2print — KDP PDF compliance scanner and formatter for self-publishing authors.
- **Live site:** https://www.manu2print.com (homepage = /).
- **Tech:** Next.js 15 (App Router), React 19, Tailwind CSS. Deployed on Vercel.
- **Scope:** Homepage (`src/app/page.tsx`) and any shared components used only for the homepage visual (e.g. `TargetGraphic`, `ToolBadge`, `FAQAccordion`). Do not change `/api`, `/lib`, auth, payments, formatter page, or other app routes.
- **Goal:** Polished, upscaled visual design. Layout and content structure are approved; refine look and feel only.

---

## 2. Hard Constraints — Do Not Change

- **Copy and content:** Do not rewrite headlines, body text, CTAs, trust lines, FAQ answers, pricing copy, or testimonial placeholder text. All wording stays exactly as is.
- **Structure and layout:** Do not reorder sections, change the two-column hero layout, add/remove sections, or alter the grid structure of tool cards, comparison table, pricing cards, or footer links. Section order and component hierarchy stay the same.
- **Functionality:** All `href`, `#how-it-works`, formatter/kdp-pdf-checker/pdf-compress links, and AuthNav must remain. No removal or renaming of interactive elements.
- **Fonts:** Keep **Bebas Neue** for display/headlines and **Inter** for body and UI. Do not introduce new font families. You may adjust weight, size, letter-spacing, or line-height within those fonts.
- **Colors (palette):** Keep the existing palette. You may refine contrast and use existing colors more consistently; do not replace the core palette:
  - **Primary orange:** `#F05A28` (CTA, accent, “WE FIX IT.”)
  - **Orange hover:** `#D94E20`
  - **Ink / headline:** `#1A1208`
  - **Charcoal / body:** `#2E2A22`
  - **Mid grey / muted:** `#6B6151`
  - **Ivory / background:** `#FAF7EE`, `#F5F0E3`, `#EDE8D8` (section alternates)
  - **Border / subtle:** `#E0D8C4`
  - **Live green:** `#2D8C4E`, bg `#EAF7EE`
  - **Orange soft (eyebrow/accents):** `#FEF0EB`
  - **Dark section:** `#1A1208`
- **SEO and metadata:** Do not change `metadata` export (title, description, openGraph, keywords) in `page.tsx`.
- **Files:** Only edit `src/app/page.tsx` and, if needed for visual polish only, `src/components/TargetGraphic.tsx`, `src/components/ToolBadge.tsx`, `src/components/FAQAccordion.tsx`. Do not modify `tailwind.config.ts`, existing rules in `globals.css`, layout, or API/lib code.

---

## 3. Design Goals — What to Optimize

- **Visual polish:** Refine spacing (padding/margins), border-radius consistency, and shadow hierarchy so the page feels more cohesive and premium. Avoid clutter.
- **Hierarchy:** Strengthen contrast between headings and body (size, weight, color) so scanning is easier. Ensure section labels, H1/H2, and body text have clear steps.
- **Components:** Give cards, buttons, the trust box, and the comparison table a more refined look (e.g. subtle shadows, consistent radius, hover states) without changing structure or copy.
- **Consistency:** Use a consistent radius scale (e.g. one standard for cards, one for buttons, one for badges). Align section vertical rhythm (e.g. consistent `py-*` or `gap-*` where it makes sense).
- **Accessibility:** Ensure focus states remain visible, contrast ratios stay compliant for text and CTAs, and touch targets stay adequate. Do not reduce contrast for purely aesthetic reasons.
- **Testimonial ticker:** The testimonial carousel/ticker is a placeholder. Polish its cards (avatar placeholder, quote box, borders) so it looks intentional and ready for real content; do not change the marquee behavior or copy.
- **Target graphic:** You may refine the SVG (e.g. stroke weights, opacity, or drop shadow) and the center CTA button (shadow, hover) for a more polished look. Do not change size prop usage or the link.
- **Badges:** ToolBadge (FREE, LIVE, COMING SOON) may get subtle refinements (radius, padding, weight); keep the existing color semantics and text.

---

## 4. Reference — Current Design Tokens (Use These)

- **Fonts:** Bebas Neue (display), Inter (body, buttons, labels).
- **CSS variables (globals.css):** `--m2p-ivory`, `--m2p-orange`, `--m2p-ink`, `--m2p-mid`, `--m2p-border`, `--m2p-live`, `--m2p-live-bg`, etc. Prefer these or the same hex values in Tailwind when adding or tweaking styles.
- **Sections (order):** Navbar → Eyebrow bar → Hero (two-column: headline + CTA left, “See How It Works” + TargetGraphic right) → Trust row (faded green box) → Pain point → How it works → Tool suite (9 cards) → Comparison table + callout → Social proof (stats + testimonial ticker) → Pricing (2 cards) → FAQ → Final CTA band → Footer.
- **Key UI patterns:** Primary CTA = orange bg, white text, rounded-xl, shadow. Ghost/secondary = border, muted text. Green “See How It Works” button above graphic. Faded green trust box. Dark section for social proof with orange accents.

---

## 5. Out of Scope

- No new sections or removal of sections.
- No copy or content changes.
- No new fonts or color palette changes.
- No changes to routing, API, auth, payments, or formatter page.
- No refactors or “clean-up” of logic; only visual/CSS-style changes.

---

## 6. Deliverables

- Updated `src/app/page.tsx` (and optionally the three components above) with Tailwind-only or minimal inline-style refinements.
- No new dependencies. No changes to `tailwind.config.ts` or to existing `globals.css` rules; you may append new utility classes or a small “polish” block in `globals.css` if necessary and documented.
- Build must pass (`npm run build`). No TypeScript or lint errors.
- A short summary of what you changed (e.g. “Unified card radius to rounded-2xl, increased section padding, refined button shadows, strengthened H2 contrast”).

---

## 7. Summary for Kimi

You are doing a **visual polish and upscale** of the manu2print homepage. Keep all structure, content, fonts, and color palette. Optimize spacing, hierarchy, shadows, borders, and consistency so the page looks more refined and professional. Do not break any links, behavior, or existing design tokens.
