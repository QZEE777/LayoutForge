# Tomorrow’s strategy plan — review, pricing, legal, affiliates, AI chatbot, social

**Use this as your “first thing tomorrow” checklist.** Review + DYOR summary, then ordered action list.

---

## 1. Review summary (done today)

### Security & payment flows — OK
- **Secrets:** All from env; no keys in repo.
- **Admin:** `ADMIN_PASSWORD_MANU2`; rate limit 30 req/min per IP.
- **Lemon Squeezy webhook:** Signature verified with `LEMONSQUEEZY_WEBHOOK_SECRET`; idempotency by `gateway_order_id`; `markDownloadPaid(downloadId)` after insert. No verification skipped.
- **Verify-access:** Checks (1) `payment_confirmed` on download meta, (2) beta_access by email+tool, (3) active subscription by email. No sensitive data leaked.
- **Create-checkout-session:** Validates priceType (single_use | subscription), passes tool + downloadId in custom data for webhook. Redirect URL uses `NEXT_PUBLIC_APP_URL`.

**Gaps to be aware of (not urgent):**
- No **refund webhook** — if Lemon Squeezy refunds, we don’t revoke access. Optional: handle `order_refunded` and set payment status or flag.
- **Terms / Privacy / Cookie** — no pages or footer links yet (see §5).
- **Support inbox** — not set up; doc says “support@manu2print.com” as placeholder.

---

## 2. DYOR: AI tools we could add

**Already in progress / spec’d:**
- **Market Analysis** — BSR-based competitor set (~6 books), advisory per book, “Go to Clarify” CTA. Spec: `docs/MARKET-ANALYSIS-SPEC.md`.

**Competitor / market context (for ideas only):**
- **Adigy** — Amazon Ads automation for KDP (AI bids, keyword discovery). Different product (ads), but shows demand for “KDP + AI.”
- **KDP Genius / BookBlitzAI** — Full workflow (niche → content → cover → ads). We’re tool-focused, not “write my book”; our angle = format, list, optimize.
- **PublishDrive Publishing Assistant** — AI metadata (categories, keywords, blurbs, pricing). Overlaps with our Description Generator + Keyword Research; we could add “AI category picker” or “title/price suggestions” as differentiators.

**Ideas that fit our stack (no commitment):**
| Idea | What | Notes |
|------|------|--------|
| **Market Analysis** | Already spec’d. BSR + curated listing data → advisory + Clarify. | Need compliant data source (e.g. Rainforest, Keepa). |
| **AI category / BISAC picker** | User pastes blurb or title → AI suggests top categories + BISAC. | Complements Description Generator; low scope. |
| **Title / subtitle optimizer** | AI suggests alternatives for title + subtitle for discoverability. | Same pipeline as format review / description. |
| **Children’s / coloring PDF checker mode** | Existing checker + DPI/bleed/safe-zone hints for image-heavy PDFs. | In `docs/COLOR-AND-CHILDRENS-BOOKS.md`. |
| **Support / onboarding chatbot** | In-product or post-download “Ask about your report” → AI with product context. | Ties to “AI chatbot idea” below. |

**Security for any new AI tool:** Same pattern as KDP Format Review — no PII in prompts unless necessary; rate limit API routes; log errors, not full content. Keep using Anthropic (or your current provider) with API key in env.

---

## 3. Pricing strategy — pay-per-use vs subscription vs hybrid

**Current:** $7 per use **or** $27 for 6 months (one product in Lemon Squeezy; two variants). No monthly subscription.

**Research takeaway:**
- **Usage-based** — Good for “I use it once or twice”; higher NDR in many SaaS studies; can feel unpredictable for users.
- **Subscription** — Predictable for you and power users; friction for occasional users (“I just want one PDF”).
- **Hybrid** — Base + usage (e.g. Intercom: seats + AI usage). Common in 2025–2026; accommodates both light and heavy users.

**Options for manu2print:**

| Option | Pros | Cons |
|--------|------|------|
| **Keep current ($7 / $27 for 6 months)** | Simple; no billing changes; authors already understand “per book” or “all-in for 6 months.” | No recurring monthly; 6-month is a one-off, not auto-renew. |
| **Add monthly subscription** (e.g. $9/mo) | Recurring revenue; good for heavy users. | More products in Lemon Squeezy; need to handle “subscription + per-use” in verify-access. |
| **Hybrid: 6-month + higher per-use** | E.g. $9 per use, $27 for 6 months. Pushes occasional users toward 6-month. | Slight price rise; communicate clearly. |
| **Tiered 6-month** | E.g. $27 = 6 months “up to 10 uses”; $47 = 6 months “unlimited.” | More variants; more logic in verify-access (usage caps). |

**Recommendation for tomorrow:** Decide one of: (A) keep as-is and document “we’re pay-per-use + 6-month pass, no subscription”; (B) add one monthly plan and wire it in Lemon Squeezy + verify-access; (C) test a small price bump ($7 → $8 or $9) and keep 6-month. Then add that to **Terms** and **footer** so it’s clear.

---

## 4. Affiliates

**Current:** Founders page (`/founders`) — “full lifetime access + affiliate commissions on every author they bring in”; 1,000+ followers; application form → `founder_applications`. DB has `profiles.role` with `'affiliate'`. No public affiliate program T&Cs or tracking links yet.

**To do:**
1. **Affiliate terms (separate doc or section in main T&Cs)**  
   Eligibility, commission (e.g. % of first payment or flat per signup), prohibited promotion (no branded PPC, no false claims), FTC disclosure, payout threshold and schedule, tax (1099 etc.), termination.
2. **Tracking**  
   Unique links or codes per affiliate; pass through checkout (Lemon Squeezy custom data or UTM); attribute sale to affiliate for payout. Lemon Squeezy has affiliate features or use a small middleware (e.g. store `affiliate_id` in custom data, record in your DB on webhook).
3. **Payouts**  
   Manual (Spreadsheet + PayPal) or tool (e.g. PartnerStack, FirstPromoter, or Lemon Squeezy if supported). Define “pay within 30 days of month-end” etc. in affiliate T&Cs.
4. **Landing page**  
   Optional: `/affiliates` with program summary, commission structure, “Apply” → founders or separate form.

**Legal:** Affiliate agreement should require: compliant disclosure (FTC), no trademark bidding, no misleading claims. See §5 for where it lives (main T&Cs vs separate Affiliate Terms).

---

## 5. Legal — T&Cs, Privacy, Cookie, Refunds

**Current:** No `/terms`, `/privacy`, or `/cookie` pages. Footer has no legal links. “Your files are processed securely and never stored permanently” is the only legal-ish copy.

**Minimum for tomorrow (or this week):**

| Doc | Purpose | Where |
|-----|--------|--------|
| **Terms of Service** | Use of site and tools, payment (Lemon Squeezy), no guarantee of KDP approval, refunds per Lemon Squeezy, limitation of liability, governing law. | `/terms` + link in footer. |
| **Privacy Policy** | What you collect (email, payment via Lemon Squeezy, file processing), why, retention, no selling data, cookies (if any), optional: GDPR/CCPA. | `/privacy` + link in footer. |
| **Cookie / consent** | If you use non-essential cookies (analytics, ads), short notice + link to Privacy. | Banner or footer line. |
| **Refund policy** | Either “Refunds per Lemon Squeezy” in Terms or short `/refunds`: time limit, how to request. | Section in Terms or `/refunds`. |

**Lemon Squeezy:** They’re the merchant; their terms apply to payment. Your Terms should say: “Payments are processed by Lemon Squeezy; refunds are handled according to their policy and our refund policy below.”

**AI / data:** In Privacy Policy, state that for AI tools (format review, description, etc.) you send content to a third-party AI provider (e.g. Anthropic) for processing; no training on customer content if that’s your policy; retention as per your design (e.g. we don’t store manuscript after 24h).

**Action:** Add footer links: Terms · Privacy (and Refunds if separate). Create the three pages (can start with simple, lawyer-approved later).

---

## 6. AI chatbot idea (Clarify / in-product)

**Current:** Market Analysis spec includes “Go to Clarify” — CTA that opens Clarify with report context for follow-up Q&A. No in-product chat yet.

**Two directions:**

**A) Clarify (external)**  
- User gets report (e.g. Market Analysis) → “Continue in Clarify” → deep link to Clarify with pre-filled context (e.g. report summary).  
- Pros: No build; Clarify owns UX and compliance.  
- Cons: User leaves your product; need Clarify’s terms and positioning (“powered by Clarify” or similar).

**B) In-product chatbot**  
- Widget on site or on download page: “Ask about your report” or “Need help?” → AI with context (product facts, tool name, optional: summary of their report).  
- Pros: Stays on manu2print; you control tone and scope (support + tips).  
- Cons: Build and maintain; need guardrails (no legal/medical advice; escalate to support@).

**Recommendation:**  
- **Short term:** Implement “Go to Clarify” for Market Analysis when that tool ships; document in spec and Terms (e.g. “We may link to third-party AI tools; their terms apply”).  
- **Later:** If you want a single “voice” for support + tips, add an in-product chat or support bot using the same AI writer persona as in `docs/UI-AND-BACK-OFFICE.md` §6.4, with PRODUCT-FACTS and behavior layer (LEGAL_OR_THREAT → direct to support@).  

**Legal:** Privacy Policy must mention if chat messages are processed by an AI provider and stored; and that support may be automated.

---

## 7. Social media — FB, LinkedIn, IG, etc.

**Goal:** Steady, low-friction presence: tips, product highlights, “author journey” angles. Not heavy sell every post.

**Content buckets (reusable):**
- **KDP tips** — “3 things to check before you upload your KDP interior”; “Bleed vs no-bleed”; “Trim sizes for picture books.”
- **Product** — “New: Journals, coloring & puzzle guide”; “Get 7 keyword phrases from your manuscript”; “Format review in under 5 minutes.”
- **Social proof** — Testimonials, “X authors used our formatter this month” (if you’re OK sharing aggregates).
- **Founder / behind-the-scenes** — “Why we added a kids trim guide”; “How we think about pricing for indie authors.”

**By platform (short):**
- **Facebook** — Groups (KDP, indie authors) > page. Share tips + link to free tools; occasional paid tool post. Avoid spam; answer questions.
- **LinkedIn** — Professional author / publisher angle. “Indie publishing tools,” “KDP formatting mistakes,” “Pricing your first paperback.” Link to blog or tool.
- **Instagram** — Carousels (e.g. “5 KDP trim sizes”), short Reels (e.g. “From Word to print-ready PDF in 3 steps”). Link in bio to manu2print.
- **X/Twitter** — Same tips as LinkedIn, shorter. Hashtags: #KDP #indieauthor #selfpublishing.

**Practical:**  
- Pick 1–2 platforms to start (e.g. LinkedIn + IG or FB group).  
- Batch 5–10 posts (or outlines); use a simple calendar (Notion, Airtable, or Buffer).  
- One CTA per post (e.g. “Try our free spine calculator” or “Get the full guide at manu2print.com”).

---

## 8. Tomorrow’s ordered list (summary)

1. **Pricing** — Decide: keep $7 / $27, or add monthly, or small bump. Document in one place (e.g. PRODUCT-FACTS + internal pricing doc).
2. **Legal** — Add Terms, Privacy, Refund (or refund section in Terms). Add footer links on main site and key pages.
3. **Affiliates** — Draft affiliate T&Cs (commission, disclosure, payouts). Decide tracking (Lemon Squeezy vs UTM + manual). Optional: `/affiliates` page.
4. **AI chatbot** — Confirm: “Go to Clarify” for Market Analysis only for now; in-product chat later. Mention in Terms/Privacy if you link to Clarify.
5. **Social** — Choose 1–2 platforms; write 3–5 post outlines (tips + product); schedule or queue.
6. **Product** — When you add new AI tools, update PRODUCT-FACTS, MARKET-ANALYSIS-SPEC (or new spec), and Privacy (AI/data).

You’re in good shape on security and payments. The biggest “must do” for trust and compliance is **legal pages + footer**. Then **pricing clarity** and **affiliate rules** so you can scale without mess.

See you later.
