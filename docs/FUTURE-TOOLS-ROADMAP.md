# Future Tools Roadmap — manu2print / LayoutForge

**Last updated:** 2026-04-07
**Purpose:** Single source of truth for all planned, specced, and coming-soon tools. Update this file whenever a tool ships or a new idea is added.

---

## Tiers

| Tag | Meaning |
|---|---|
| `SPECCED` | Full spec written, ready to build |
| `COMING SOON` | Already in platformTools.ts, visible to users |
| `IDEA` | Discussed, not yet specced |
| `ARCHIVED` | Deprioritised or superseded |

---

## 🟢 Priority Queue (build next)

### 0.85 Verify Social QA Sweep `SPECCED`
**What it is:** Final polish + validation pass for the verify-page social sharing flow.

**Focus:**
- Facebook share behavior/addressing polish
- Full end-to-end test on remaining platforms (X, LinkedIn, WhatsApp, Telegram, Instagram helper flow)
- Verify login-redirect behavior and post-page handoff on each platform
- Validate copy actions (`Copy Caption + Link`, `Copy Link Only`) across desktop/mobile

**Why priority:** Share flow is now a core growth loop and must be reliable across all channels.

---

### 0.75 Crypto Wallet Integration `IDEA`
**What it is:** Add crypto wallet support in a future phase for payments and/or account-linked access flows.

**Initial scope to decide later:**
- Which wallet rails/providers to support first
- Whether wallet is checkout-only or also account identity
- Compliance, refund handling, and payment reconciliation path

**Why priority:** Strategic future monetization/payment flexibility; keep in planning queue until implementation window.

---

### 0.5 Checker Status Color Consistency `SPECCED`
**What it is:** Enforce one strict color system for checker outcome cards on every upload so visual status never drifts.

**Rule set to enforce globally:**
- **Pass / Ready:** green
- **Warning / Nearly ready / Medium risk:** orange
- **Fail / High risk:** red

**Scope:**
- Readiness badge (letter + ring)
- Score headline + supporting status text
- Issues/risk rows and accents
- Any upload result state where checker status is shown

**Why priority:** Avoid mixed signals and keep trust/clarity consistent scan-to-scan.

---

### 0. Repo Hygiene Follow-up `SPECCED`
**What it is:** Close out currently untracked project assets so nothing important is left floating locally.

**Items to resolve:**
- `docs/FUTURE-TOOLS-ROADMAP.md` — decide: keep in repo (commit) or archive/delete.
- `scripts/upload-covers-to-r2.mjs` — decide: keep as official ops script (commit + docs) or remove.

**Why priority:** Prevent silent drift between local workspace and GitHub, and keep deployment/source-of-truth clean.

---

### 1. KDP Profit Checker `SPECCED`
**Route:** `/kdp-profit-checker`
**Type:** Free tool (lead magnet → $9 PDF checker CTA)
**Spec:** Written 2026-04-07 in session. Full spec in memory.

**What it does:**
- Multi-marketplace profit calculation (US, UK, DE, FR, ES, IT, JP, CA, AU)
- Two pricing modes: "I want $X profit" vs "I set my price"
- Per-marketplace verdict cards (✅ Profitable / ⚠️ Low margin / ❌ Not viable)
- Auto-conversion warning — shows KDP auto-price vs optimal price gap (killer feature)
- Color Impact Simulator — toggle B&W ↔ Color, see profit delta instantly
- "Before You Publish" summary — combined verdict across all markets
- Export pricing table (Phase 2 / email gate)

**Tech:** 100% client-side. Static KDP rate data. Optional exchange rate API (free tier). No DB, no migrations.
**Reuses:** `royaltyCalc.ts`, `ToolPageShell`, `KdpConversionBridge`
**New:** `lib/kdpProfitEngine.ts`, `/kdp-profit-checker/page.tsx`
**Estimated build:** 2–3 days
**Funnel logic:** Free profit check → "Now check your file → KDP PDF Check $9"
**Note:** `/royalty-calculator` stays live, gets a "↗ Try the new KDP Profit Checker" banner.

---

## 🟡 Coming Soon (already in platformTools.ts)

### 2. Kindle EPUB Maker `COMING SOON`
**Route:** `/epub-maker`
**Type:** Paid ($9/scan)
**What it does:** Converts manuscript to Kindle-ready EPUB.
**Spec file:** `docs/EPUB-MAKER-IMPLEMENTATION-PLAN.md`
**Status:** Specced, not built.

### 3. Market Analysis `COMING SOON`
**Route:** `/market-analysis`
**Type:** Paid ($9/scan)
**What it does:** AI analyzes competitor books — key selling points and differentiation.
**Spec file:** `docs/MARKET-ANALYSIS-SPEC.md`
**Status:** Specced, not built.

### 4. 7 Keyword Research — DOCX `COMING SOON`
**Route:** `/keyword-research`
**Type:** Paid ($9/scan)
**What it does:** Returns 7 KDP keyword phrases from a DOCX manuscript.
**Status:** Stub in platformTools.ts, partial implementation likely exists.

### 5. 7 Keyword Research — PDF `COMING SOON`
**Route:** `/keyword-research-pdf`
**Type:** Paid ($9/scan)
**What it does:** Same as above but PDF input.
**Status:** Stub in platformTools.ts.

### 6. Description Generator — DOCX `COMING SOON`
**Route:** `/description-generator`
**Type:** Paid ($9/scan)
**What it does:** Full Amazon listing — book description, author bio, BISAC categories from DOCX.
**Status:** Stub in platformTools.ts.

### 7. Description Generator — PDF `COMING SOON`
**Route:** `/description-generator-pdf`
**Type:** Paid ($9/scan)
**What it does:** Same as above but PDF input.
**Status:** Stub in platformTools.ts.

### 8. Kids Book Trim Guide `COMING SOON`
**Route:** `/kids-trim-guide`
**Type:** Free
**What it does:** Trim sizes and page counts for picture books and children's titles.
**Status:** Stub in platformTools.ts.

### 9. Journals, Coloring & Puzzle Guide `COMING SOON`
**Route:** `/journals-coloring-puzzle-guide`
**Type:** Free
**What it does:** Trim sizes, page counts, KDP tips for journals, workbooks, coloring books, activity books.
**Spec file:** `docs/JOURNALS-COLORING-PUZZLE-TOOLS.md`
**Status:** Stub in platformTools.ts.

---

## 🔵 Ideas (discussed, not yet specced)

### 10. KDP PDF Checker Add-ons `IDEA`
**What it does:** Extensions to the existing PDF checker.
**Spec file:** `docs/KDP-PDF-CHECKER-ADDONS.md`
**Status:** Ideas captured, not prioritised.

### 11. Smart Format Tool `IDEA`
**Spec file:** `docs/SMART-FORMAT-SPEC.md`
**Status:** Concept stage.

---

## 🗄️ Archived / Deprioritised

### IngramSpark Platform
Archived in `platformTools.ts > ARCHIVED_PLATFORMS`. KDP-only focus for now.

### Gumroad Platform
Archived in `platformTools.ts > ARCHIVED_PLATFORMS`. KDP-only focus for now.

---

## Notes

- When a tool ships: remove from this list, add to `platformTools.ts` as `available: true`, update `docs/PRODUCT-FACTS.md` and `ai-knowledgebase/features.md`.
- Pricing default: `$9 per scan` for paid tools unless otherwise noted.
- Free tools are lead magnets — always include a `KdpConversionBridge` CTA after user interaction.
