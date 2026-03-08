# Beta directive — conflicts detected & implementation plan

**Security stance:** Design and copy only. No new API routes, auth, or user-controlled content. All links remain internal. Hero visual will be static (SVG/illustration). **Safe to implement** from a security perspective.

---

## 1. Conflicts detected

### 1.1 Tool names and mapping

| Directive card           | Current app                                      | Resolution |
|--------------------------|---------------------------------------------------|------------|
| **Print Ready Check**    | ✅ Exists (`/kdp-pdf-checker`, title "Print Ready Check") | Use as-is. Primary CTA. |
| **Cover Check**          | ❌ No "Cover Check" tool. We have cover-calculator, spine-calculator. | Show as **Coming Soon** card (green), no link. |
| **Book Layout Fixer**    | ❌ No exact match. KDP Formatter fixes layout from DOCX. | Show as **Coming Soon** (green). |
| **AI Formatter**         | We have KDP Formatter (DOCX) and KDP Format Review (AI). | Show as **Coming Soon** (purple) or link Format Review if you want. |
| **Trim Size Calculator** | ✅ trim-size-comparison, cover-calculator, interior-template, page-count-estimator | Link "Trim Size Calculator" to `/trim-size-comparison` (blue, available). |

**Decision:** Homepage toolkit will feature the directive’s 5 cards for clarity. We will **keep** the full tool list (paid / coming soon / free) in a second section or on the Tools hub so nothing is removed. No routes or `platformTools` IDs changed.

### 1.2 Navigation

- **Directive:** Tools | How It Works | Pricing | About + primary CTA "Check My PDF".
- **Current:** Tools, Founders, AuthNav (no How It Works, no Pricing).
- **Resolution:** Add **How It Works** → anchor `#how-it-works` on homepage. Add **Pricing** → new `/pricing` page (short: $7 / $27, link to tools) or anchor `#pricing` on homepage. Keep **Founders** in footer. Primary CTA in nav = "Check My PDF" → `/kdp-pdf-checker`.

### 1.3 Color system

- **Directive:** Orange = paid/flagship, Blue = available, Green = coming soon, Purple = AI.
- **Current:** `brave` (#FB542B, orange), `freeGreen`, `amazon-navy`. No explicit “blue” for available, no purple for AI.
- **Resolution:** Use **brave** for primary/paid. **freeGreen** for coming soon. Add **blue** for “available” (e.g. Tailwind `blue-600` or new token). Add **purple** for AI/experimental (e.g. `violet-600`). Keep existing tokens; extend only where needed for new card types.

### 1.4 Hero and CTA

- **Current:** Bullseye visual, “Hit the target before you upload to KDP”, “Check your PDF” button.
- **Directive:** Headline “Turn Your Manuscript Into a Print-Ready Book”, subhead “Check, fix, and prepare your PDF for Amazon KDP before you upload.”, support “Avoid rejection. Save hours of frustration. Publish with confidence.” Hero image: PDF with diagnostic overlays (red/yellow/green). Primary “Check My PDF”, secondary “See How It Works”.
- **Resolution:** Replace hero copy with directive text. Primary button “Check My PDF” → `/kdp-pdf-checker`. Secondary “See How It Works” → `#how-it-works`. Hero visual: add an SVG (or image) suggesting a PDF with margin/bleed/trim markers (red/yellow/green) — **static only**, no user content.

### 1.5 Homepage structure

- **Directive order:** Hero → Problem (KDP rejection pain) → Toolkit → How it works (3 steps) → Benefits → Trust → Final CTA.
- **Current:** Hero → Trust strip → Social proof ticker → What you get (tools).
- **Resolution:** Restructure to: 1) Hero, 2) Problem (short section), 3) Toolkit (directive’s 5 cards + optional “all tools” link), 4) How it works (3 steps), 5) Benefits (3 bullets), 6) Trust (existing security + optional social proof), 7) Final CTA. Keep footer as-is (legal, links, Tools).

### 1.6 Pricing page

- **Directive:** “Pricing” in nav.
- **Current:** No `/pricing` route.
- **Resolution:** Add a minimal **`/pricing`** page: $7 per use, $27 for 6 months, link to Tools; or add a `#pricing` section on homepage and point nav there. Recommended: simple `/pricing` page for clarity and SEO.

### 1.7 Manny / chatbot

- **Directive:** “Hi, I'm Manny. I help turn manuscripts into print-ready books.” Friendly, knowledgeable.
- **Current:** Manny already named; persona in docs.
- **Resolution:** No code conflict. When the chat widget is built, use this intro. Optionally add to `docs/AI-ASSISTANT-NAME-AND-SETUP.md` or FAQ-FOR-BOT as Manny’s opening line.

---

## 2. What we are NOT changing (security and stability)

- No new API routes or auth logic.
- No change to payment, webhooks, or download flows.
- No user content in hero (static asset only).
- Existing tool routes and `platformTools` IDs unchanged; only homepage presentation and nav change.
- Footer and legal links unchanged.
- Admin, dashboard, and auth flows untouched.

---

## 3. Implementation plan (on your confirmation)

1. **Tailwind:** Add optional tokens for “available” (blue) and “AI” (purple) if not using default Tailwind colors.
2. **Homepage (`page.tsx`):**  
   - New hero: directive headline, subhead, support text; static hero visual (PDF-style SVG); CTAs “Check My PDF”, “See How It Works”.  
   - New section: **Problem** (KDP rejection pain, 2–3 sentences).  
   - **Toolkit:** 5 directive cards (Print Ready Check orange, Cover Check / Book Layout Fixer / AI Formatter coming soon, Trim Size Calculator blue). Optional: keep “What you get” grid below with existing tools or replace with single “See all tools” → `/platform/kdp`.  
   - **How it works:** 3 steps (upload → analyze → see what to fix).  
   - **Benefits:** 3 outcome bullets (avoid rejection, save time, publish with confidence).  
   - **Trust:** Keep current security line + ticker if desired.  
   - **Final CTA:** One clear “Check My PDF” or “Get started” block.
3. **Nav:** Tools, How It Works (#how-it-works), Pricing (/pricing), About. Primary CTA “Check My PDF” → `/kdp-pdf-checker`. Keep AuthNav. Move Founders to footer only if desired.
4. **New route:** `src/app/pricing/page.tsx` — short page with $7 / $27, link to tools, same layout as other static pages.
5. **Manny:** Add directive intro line to `docs/AI-ASSISTANT-NAME-AND-SETUP.md` (or FAQ-FOR-BOT) for when the widget is implemented.
6. **Mobile:** Keep responsive layout; stack sections and cards vertically; large tap targets for CTAs.
7. **Tone:** Use directive tone (helpful, expert, direct, friendly) in new copy; subtle humor only where we control the strings (e.g. tool messages), not in this first pass.

---

## 4. Confirm

Once you confirm, implementation will:

- Restructure the homepage to match the directive flow and copy.
- Add Problem, How it works, Benefits, and Final CTA sections.
- Add the 5-card toolkit (with correct colors and Coming Soon where needed).
- Update nav (How It Works, Pricing, primary CTA).
- Add `/pricing` page.
- Add static hero visual (SVG).
- Document Manny’s intro for the future widget.
- Leave all existing routes, security, and payment logic unchanged.

**Reply with "Confirm" or "Go" to proceed. If you want any conflict resolved differently (e.g. different tool mapping or no Pricing page), say how and we’ll adjust the plan.**
