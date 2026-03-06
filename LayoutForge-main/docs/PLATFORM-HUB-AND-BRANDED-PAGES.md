# Platform hub + branded tool pages

## Concept

- **Homepage:** Neutral, low-clutter hub. One main brand (manu2print) look. Content organized **by platform**, not by tool type.
- **Platform tool pages:** When the user enters a given platform’s area (e.g. “Amazon KDP”), that experience uses **that platform’s** visual identity (colors, typography, design cues).

So: **home = neutral hub; inside each platform = that platform’s branding.**

---

## Homepage (neutral hub)

- **Look:** Single neutral palette and design (current manu2print style). No platform-specific colors or logos in the main chrome.
- **Structure:** One section per platform. Each section has:
  - **Platform logo** — display each brand’s logo in its box (Amazon, IngramSpark, Gumroad, etc.) for instant recognition and trust. Keeps the hub clear: “that’s KDP, that’s IngramSpark.” Use logos at a consistent, modest size so the layout stays clean.
  - One clear line, e.g. “Everything you need for Amazon KDP”
  - Cards/links to **only that platform’s tools**
- **Result:** User sees “Amazon KDP” | “IngramSpark” | “Gumroad” | etc. Clean, high-level, easy to scan.
- **Logo use:** Use logos in a nominative, descriptive way (“tools for [platform]”). Where a logo isn’t available or we want a fallback, use the platform name + a simple icon so every box has a clear visual anchor.

Example blocks:

| Platform      | Tagline (example)                    | Tools (current / future) |
|--------------|--------------------------------------|---------------------------|
| Amazon KDP   | Everything you need for Amazon KDP   | Formatter DOCX, PDF Optimizer, PDF Checker, Kindle EPUB, Royalty Calculator, Format Review (soon), … |
| IngramSpark  | Everything you need for IngramSpark  | Formatter (coming soon), … |
| Gumroad      | Everything you need for Gumroad       | Digital product formatter (coming soon), … |
| (others)     | …                                    | As we add them            |

- Free tools (e.g. PDF Compressor) can stay in a small “Free tools” strip at top or live under the first platform that uses them (e.g. KDP), with a note that they’re free for everyone.

---

## Platform-branded tool pages

- When the user clicks into **Amazon KDP** tools (e.g. formatter, checker, royalty calc), the **layout, colors, and feel** of that area follow **Amazon’s** visual language (e.g. orange/black, smile, familiar Amazon-style UI).
- Same for **IngramSpark**, **Gumroad**, etc.: each platform’s tools live in pages/sections that use **that platform’s** design and color system.
- Implementation options:
  - **Route-based:** e.g. `/platform/kdp/*` uses KDP theme; `/platform/ingram/*` uses IngramSpark theme.
  - **Theme tokens:** CSS variables or Tailwind theme per platform (e.g. `--platform-primary`, `--platform-bg`) and a layout that reads them.
  - **Layout wrapper:** A “platform layout” component that wraps all tools for that platform and injects logo, nav, and theme.

---

## Benefits

- **Home:** Less clutter, clear “pick your platform” mental model.
- **Inside each platform:** Feels native and trustworthy (e.g. “this really is for KDP”).
- **Scales:** New platforms = new block on home + new theme for their section.

---

## When to implement

- Documented here for when we’re ready to refactor the homepage and add platform-specific theming.
- Can be done in steps: e.g. (1) restructure home into platform blocks, (2) add KDP-themed layout for KDP routes, (3) add more platforms and themes over time.
