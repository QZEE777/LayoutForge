# LOKALEE — Project Specification & Source of Truth

**Version:** 0.1 — Founding Document  
**Status:** Pre-build · Validation Phase  
**Last Updated:** June 2026  
**Founder:** Zed (QZEE777)  
**Built with:** Claude Code (claude-sonnet-4-6)

> Move this file to the root of the Lokalee GitHub repo when created.  
> This document is the single source of truth. Update it when anything changes.

---

## What Is Lokalee

Lokalee is a live local discovery platform for tourist towns.

Not a directory. Not a review site. Not a national deals aggregator.

A live feed — updated every morning by the actual businesses in the actual town — showing exactly what is on today. What's open right now. What ends in two hours. What the wine farm just posted because the weather turned perfect. Flash deals with countdown timers. Events happening tonight. All of it in one place, filtered by category, filtered by time.

**The single behavior Lokalee must prove:**
> A tourist arrives in a town, opens Lokalee, and finds something worth doing today.

Everything else is secondary to that one behavior.

---

## The Problem

A tourist arrives in Plettenberg Bay on a Tuesday afternoon.

They do not know:
- Which restaurant has a lunch special right now
- Which wine farm is doing a sunset tasting tonight
- Which spa is running a midweek offer
- Which activities are weather-dependent and available today

Google is poor at solving this. It is not designed around real-time local activity.  
Facebook groups are fragmented. Posts get buried within hours.  
Instagram requires following individual businesses.  
WhatsApp groups are invisible to visitors.

The information exists. The deals exist. The town is alive.  
Nobody can find any of it in real time.

That is the gap.

---

## The Solution — V1 Only

### What V1 Is

Three screens. Nothing else.

1. **The town feed** — today's specials listed by category (food, drink, wellness, activities, events)
2. **The business card** — name, photo, today's offer, WhatsApp contact button
3. **The QR landing** — what loads when someone scans the entry QR code

No accounts required to browse.  
No app download required.  
No registration friction.

A PWA (Progressive Web App) served from a Next.js frontend.  
The QR code at the petrol station opens it in 4 seconds.

### What V1 Is NOT

Do not build the following until behavior is proven:

| Feature | Phase |
|---|---|
| Loyalty / Passport system | Phase 2 |
| Physical passport booklet | Phase 2 |
| Flash deal countdown timers | Phase 1.5 |
| Consumer accounts / wallets | Phase 2 |
| WhatsApp AI per business | Phase 3 |
| Analytics dashboard | Phase 2 |
| Push notifications | Phase 2 |
| Weather-triggered deals | Phase 2 |
| Business self-serve dashboard | Phase 1.5 |
| Payment / subscriptions | Phase 1.5 |
| Multi-town support | Phase 3 |
| White-label / franchise | Phase 4 |

---

## Validation Before Building

Before writing a line of production code, validate:

**The question to ask every business (verbatim):**
> "If I set this up today, would you WhatsApp me your special tomorrow morning so I can have it live by 9am?"

A yes to a hypothetical means interest.  
A yes to this specific ask means commitment. The difference is everything.

**Validation target:**
- 10 restaurants
- 5 wine farms
- 5 spas
- 5 activity providers

**Pass criteria:**  
7 out of 10 say yes with a committed specific action (give you their number, agree to send tomorrow's special).

**Fail criteria:**  
Fewer than 5 committed yeses. Stop. Ask why. The answer to "why not" is worth more than any yes.

**Pilot town:** Plettenberg Bay only. No other town until Plett is working.

---

## The Concierge MVP (Phase 0)

Before a self-serve dashboard exists, Zed IS the dashboard.

**The workflow:**
1. Business owner WhatsApps Zed: "Burger special today, R89, 12–3pm"
2. Zed publishes it manually to the platform
3. Special goes live

This is not a bug. This is the correct approach.

You are not validating software.  
You are validating whether businesses will post consistently and whether tourists will open it.  
The Concierge MVP answers both questions without building complex infrastructure.

**Duration:** 60 days maximum.  
**Exit condition:** 20+ businesses posting weekly, 500+ monthly unique visitors.

---

## Pricing Model

Do not offer free forever. Free validation is weak validation.

**From day one of onboarding, state the price:**

> "We are launching in Plett in [month]. Sixty days free as a founding member. From [month+2], R399/month. Here is exactly what you get."

The business knows what they are committing to. Their yes is real.

**Tier structure (Phase 1.5+):**

| Tier | Price | Includes |
|---|---|---|
| Starter | R399/month | Listing + daily specials + basic view count |
| Professional | R699/month | + Flash deals + Passport loyalty + analytics |
| Premium | R999/month | + WhatsApp AI assistant per business |

Consumers: free forever. They are the product — their visits, their loyalty data, their word of mouth fund the business subscriptions.

---

## Tech Stack

### Non-Negotiable

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 15 App Router + TypeScript | Same as manu2print. Zed knows it. Claude Code can build it. |
| Styling | Tailwind CSS | Same as manu2print. No CSS Modules. No inline styles. |
| Database | Supabase (Postgres) | Same as manu2print. Proven. Row Level Security built in. |
| Hosting | Vercel | Same as manu2print. Zero-config deploys. |
| Auth | Supabase Auth | WhatsApp OTP for consumers. Email/password for businesses. |
| Storage | Cloudflare R2 | Business photos, special images. Same pattern as manu2print. |
| AI (Phase 3) | Anthropic Claude API via `@anthropic-ai/sdk` | WhatsApp AI assistant per business. |

### Do Not Use

- FlutterFlow — not the stack, not maintainable
- Firebase — billing issues, different paradigm, not the stack
- Render — permanently removed from stack (per manu2print constraints)
- mammoth.js — banned

### Delivery Model

```
Consumer Browser → Next.js PWA (Vercel)
Business WhatsApp → Zed (Phase 0) → Manual publish
Business Dashboard → Next.js admin (Phase 1.5)
Business Photos → Cloudflare R2 (presigned URL upload)
AI Queries → Anthropic Claude API → WhatsApp Business API response
```

---

## Anthropic Tools — Relevant GitHub Repos

Sourced directly from [github.com/anthropics](https://github.com/anthropics). Use these — do not reinvent.

| Repo | URL | When to Use |
|---|---|---|
| `anthropic-sdk-typescript` | [github.com/anthropics/anthropic-sdk-typescript](https://github.com/anthropics/anthropic-sdk-typescript) | Phase 3: WhatsApp AI calls to Claude API |
| `claude-agent-sdk-typescript` | [github.com/anthropics/claude-agent-sdk-typescript](https://github.com/anthropics/claude-agent-sdk-typescript) | Phase 3: multi-step AI agent for business assistant |
| `claude-quickstarts` | [github.com/anthropics/claude-quickstarts](https://github.com/anthropics/claude-quickstarts) | Reference for deployable AI application patterns |
| `claude-cookbooks` | [github.com/anthropics/claude-cookbooks](https://github.com/anthropics/claude-cookbooks) | Reference for AI feature implementation patterns |
| `claude-code-security-review` | [github.com/anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review) | Add to CI/CD pipeline — automated security review on every PR |
| `claude-code-action` | [github.com/anthropics/claude-code-action](https://github.com/anthropics/claude-code-action) | GitHub Actions integration for automated code review |
| `claude-plugins-official` | [github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Official Claude Code plugins to extend development workflow |

**Install the TypeScript SDK when Phase 3 begins:**
```bash
npm install @anthropic-ai/sdk
```

**Model to use for WhatsApp AI responses:**
```
claude-haiku-4-5-20251001
```
Haiku is fast, cheap, and sufficient for answering "what are today's specials?" queries. Do not use Sonnet or Opus for per-message responses — cost will not scale.

---

## Security Architecture

Security is non-negotiable. Every decision must start here.

### Principles

1. **Never trust client-provided data.** Every request must be validated server-side. Business IDs, user IDs, town IDs — all derived from session or verified token, never from the request body.
2. **Row Level Security on every Supabase table.** No exceptions. No table without RLS policies.
3. **No credentials in code.** All secrets in environment variables. Vercel for production. `.env.local` for development. Never committed.
4. **Presigned URLs for file uploads.** No direct R2 writes from the browser. Same pattern as manu2print.
5. **Rate limiting on all public endpoints.** The specials feed is public. It must be rate-limited to prevent scraping and abuse.
6. **Input sanitisation on all business-submitted content.** Special descriptions, business names, event titles — all sanitised before storage and before render. No XSS vectors.
7. **HTTPS everywhere.** No exceptions. Vercel enforces this by default.
8. **Signed short-lived tokens for any sensitive actions.** Not UUID-as-capability-token. If a link needs to do something, it is HMAC-signed with an expiry.

### Supabase RLS Policy Structure

Every table requires these policies at minimum:

```sql
-- Businesses can only read/write their own records
-- Consumers can only read public content
-- Admins have elevated access via role check
-- Anonymous users can read active specials only (consumer feed)
```

### Content Integrity

Business-submitted content is user-generated content. Treat it as hostile.

- Sanitise all text fields on write (strip HTML, limit length)
- Validate image uploads by MIME type and file size on the server, not the client
- Moderate flagging system from Phase 2 — a consumer can flag a misleading deal

### AI Safety (Phase 3)

The WhatsApp AI speaks as the business. It must not:

- Make promises the business has not authorised
- Reveal internal business data not published on the platform
- Accept or confirm bookings without explicit business configuration
- Respond to prompt injection attempts from end users

System prompt for the business AI must be locked server-side. Never editable by the business directly without review. Loaded from Supabase, not from client input.

---

## Database Schema (Proposed — Phase 1)

```sql
towns
  id uuid PK
  name text
  slug text UNIQUE
  country text
  active boolean

businesses
  id uuid PK
  town_id uuid FK → towns.id
  name text
  category text  -- restaurant | wine_farm | spa | activity | cafe | bar | accommodation
  whatsapp text
  address text
  subscription_status text  -- trial | active | inactive
  subscription_tier text  -- starter | professional | premium
  created_at timestamptz

specials
  id uuid PK
  business_id uuid FK → businesses.id
  title text
  description text
  image_url text
  valid_from timestamptz
  valid_until timestamptz
  is_flash boolean
  active boolean
  created_at timestamptz

events
  id uuid PK
  business_id uuid FK → businesses.id
  title text
  description text
  event_date date
  event_time time
  image_url text
  active boolean
```

Phase 2 adds: `users`, `passport_stamps`, `loyalty_wallets`, `rewards`  
Phase 3 adds: `ai_configs`, `whatsapp_sessions`, `conversation_logs`

---

## Phase Roadmap

### Phase 0 — Concierge MVP (Now)
- [ ] Validate 20+ committed businesses via in-person conversations in Plett
- [ ] Set up Supabase project (`lokalee-prod`)
- [ ] Create GitHub repo (`QZEE777/lokalee`)
- [ ] Build basic PWA: town feed + business card + QR landing
- [ ] Deploy to Vercel
- [ ] Place QR codes at 5 physical locations in Plett
- [ ] Zed publishes specials manually via WhatsApp intake
- **Exit criteria:** 20 businesses posting weekly, 200+ unique visitors/month

### Phase 1 — Self-Serve (60 days post-launch)
- [ ] Business self-serve dashboard (publish special, upload photo, set hours)
- [ ] Subscription billing via Paystack (SA-native payment gateway)
- [ ] Flash deals with countdown timers
- [ ] Basic view analytics per business
- **Exit criteria:** 30+ paying businesses at R399/month, 500+ MAU consumers

### Phase 2 — Loyalty & Engagement
- [ ] Consumer accounts (WhatsApp OTP signup)
- [ ] Lokalee Passport (digital stamp wallet)
- [ ] Physical passport booklet (print run, distribute via Plett Tourism)
- [ ] Cross-business loyalty rewards
- [ ] Push notifications for flash deals (PWA push)
- [ ] Weather API integration (trigger contextual deal surfacing)
- [ ] Business pairing / bundle deals
- **Exit criteria:** 50+ businesses, 1,000+ MAU, measurable repeat visits

### Phase 3 — AI Layer
- [ ] WhatsApp Business API integration (via Twilio or 360dialog)
- [ ] Per-business WhatsApp AI using `@anthropic-ai/sdk` + claude-haiku
- [ ] AI trained on: business menu, hours, active specials, FAQs
- [ ] Second town (Knysna or Hermanus)
- **Exit criteria:** 10+ businesses on Premium tier, AI handling 50%+ of WhatsApp queries

### Phase 4 — Scale
- [ ] Multi-tenant architecture (town-level data isolation)
- [ ] Licensing model for third-party town operators
- [ ] Afrikaans language support
- [ ] National Tourism Board partnership conversations
- [ ] International pilot (Portugal or Greece — TBD)

---

## Routing & Component Conventions

- App Router only. No Pages Router.
- Server Components by default. Add `"use client"` only when browser APIs are genuinely required.
- No `getServerSideProps`. No `getStaticProps`.
- Data fetching in Server Components — query Supabase directly.
- Never trust client-provided IDs — derive from session.

---

## Design System

| Token | Value |
|---|---|
| Background | `#FAFAF7` (warm white) |
| Primary CTA | Warm coral or deep green — TBD with designer |
| Text | `#1A1208` (near-black) |
| Display typeface | TBD — must feel local, warm, not corporate |
| Tailwind CSS only | No inline styles, no CSS Modules |
| Component merging | Use `cn()` utility |

> Design system to be finalized before Phase 1 frontend build begins.

---

## Working With Zed (CRITICAL)

- Zed is non-technical. He directs. Claude executes.
- One change at a time. Wait for confirmation before the next step.
- No "find this line" instructions — provide exact file paths and complete replacement blocks.
- If a task deviates from spec — stop and flag it. Do not patch around it.
- No autonomous decisions on architecture. Ask first.
- Copy-paste ready output always.
- No credentials in code. Ever.
- Never deploy without explicit instruction from Zed.
- Never push to GitHub without explicit instruction from Zed.

---

## DO NOT

- Do not build the Passport before the feed is proven
- Do not build the WhatsApp AI before businesses are paying
- Do not expand to a second town before Plett has 30 paying businesses
- Do not use FlutterFlow or Firebase
- Do not use Render
- Do not use mammoth.js
- Do not add features not in the current phase
- Do not skip RLS on any Supabase table
- Do not store credentials in code
- Do not accept business IDs from client requests — always derive server-side
- Do not charge businesses without a clear stated price from day one
- Do not offer free forever — free validation is weak validation

---

## Key Decisions Log

| Decision | Rationale | Date |
|---|---|---|
| Name: Lokalee | No trademark conflicts found in web search. Friendly, phonetic, scalable internationally, no meaning in major languages. Needs formal CIPC + USPTO search before filing. | June 2026 |
| Pilot: Plettenberg Bay | Tourist town, high off-season pain, compact enough to validate manually, strong business community, affluent tourist demographic | June 2026 |
| Stack: Next.js + Supabase | Same as manu2print. Zed knows it, Claude Code can build it, no learning curve. | June 2026 |
| No app — PWA only | Eliminates app store friction for tourists. QR → browser → value in 4 seconds. | June 2026 |
| Concierge MVP first | Validate behavior before building software. Be the dashboard via WhatsApp intake. | June 2026 |
| Haiku for WhatsApp AI | Cost-efficient for high-frequency simple queries. Sonnet reserved for complex tasks. | June 2026 |
| Phase 0: no Passport | Loyalty system creates complexity before the core behavior is proven. Phase 2 only. | June 2026 |
| Paystack for payments | SA-native. Handles ZAR. Better than Stripe for local card acceptance in SA. | June 2026 |

---

## Trademark & Legal

- LOKALEE name requires formal trademark search before filing:
  - [CIPC South Africa](https://www.brandlaw.co.za/search/)
  - [USPTO TESS](https://tmsearch.uspto.gov)
  - [WIPO Global Brand Database](https://www.wipo.int/en/web/global-brand-database)
- Register domain: `lokalee.com` / `lokalee.co.za` — check availability before committing to name
- Business subscriptions require compliant terms of service covering content ownership, data usage, and subscription cancellation
- Consumer data collection requires POPIA compliance (South Africa's data protection law)

---

## Repository Structure (When Created)

```
/lokalee
  /src
    /app              — Next.js App Router pages
    /app/api          — API route handlers
    /components       — Shared UI components
    /lib              — Supabase client, R2 helpers, utilities
    /types            — TypeScript type definitions
  /public             — Static assets
  LOKALEE.md          — This file (source of truth)
  .env.example        — Environment variable template (no values)
```

---

*This document is the source of truth. Update it when the stack changes, a phase completes, or a decision is reversed. Never let it go stale.*

*Last updated: June 2026*
