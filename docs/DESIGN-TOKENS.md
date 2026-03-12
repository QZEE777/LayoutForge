# Design tokens — site-wide colors

Use these so the **homepage look** (ivory, orange, ink, muted) propagates across nav, footer, and content pages.

## Tailwind: `m2p-*` (manu2print light theme)

Defined in `tailwind.config.ts` and aligned with `globals.css` `--m2p-*` variables.

| Use case | Class | Hex |
|----------|--------|-----|
| Page / section background | `bg-m2p-ivory` | #FAF7EE |
| Headlines, dark text | `text-m2p-ink` | #1A1208 |
| Body, secondary text, nav links | `text-m2p-muted` | #6B6151 |
| Links, CTAs, accent | `text-m2p-orange` / `bg-m2p-orange` | #F05A28 |
| Link/button hover | `hover:text-m2p-orange` / `hover:bg-m2p-orange-hover` | #D94E20 |
| Borders, dividers | `border-m2p-border` | #E0D8C4 |
| Success, secondary CTA, “live” | `text-m2p-live` / `bg-m2p-live` | #4cd964 |
| Soft orange strip (eyebrow) | `bg-m2p-orange-soft` | #FEF0EB |
| Footer / dark section bg | `bg-m2p-ink` | #1A1208 |

**Where to use:** SiteShell, SiteNav, SiteFooter, homepage, about, pricing, FAQ, contact, legal, terms, privacy, refunds, cookies, affiliate, and any page that uses the shared shell with ivory background.

## When to use `brand-*` instead

The **brand** palette in Tailwind is the **dark theme** (e.g. `bg-brand-bg`, `text-brand-cream`, `text-brand-gold`). Use it only on tool pages that keep their own dark layout (e.g. banned-keyword-checker, interior-template, founders). Do not mix brand- and m2p- on the same page.

## Fonts

- **Bebas Neue** — display/headlines (use `font-bebas` or `style={{ fontFamily: "'Bebas Neue', sans-serif" }}`).
- **Inter** — body and UI (default sans or `style={{ fontFamily: "Inter, sans-serif" }}`).

## Rolling out to more pages

When adding or editing a content page that uses the shared layout:

1. Use `bg-m2p-ivory` for section backgrounds (or rely on SiteShell).
2. Use `text-m2p-ink` for headings, `text-m2p-muted` for body.
3. Use `text-m2p-orange` and `hover:text-m2p-orange` for links.
4. Use `border-m2p-border` for card borders.
5. Prefer `m2p-*` classes over raw hex so one theme change updates the whole site.
