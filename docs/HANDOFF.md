# manu2print.com — HANDOFF.md

Date: 2026-03-22

## What This Is

manu2print.com is a browser-based KDP publishing toolkit for indie authors.
Repo: QZEE777/LayoutForge | Live: https://www.manu2print.com | Deployed: Vercel

---

## Stack

- Next.js 15, TypeScript, Tailwind CSS
- Supabase (auth + database)
- Lemon Squeezy (payments — currently in TEST MODE)
- Cloudflare R2 (file storage, USE_R2=true on all services)
- Railway: clever-magic (Node worker) + kdp-preflight-engine (Python FastAPI)
- Resend (email — NOT YET IMPLEMENTED)

---

## Current Status (2026-03-22)

### LIVE and working

- Homepage: full overhaul deployed — hero, pricing, platform expansion, footer
- KDP PDF Checker (/kdp-pdf-checker): upload, scan, annotated PDF, compliance report
- Scoring: fixed — deduplication by rule_id, correct weighted formula
- Download page (/download/[id]): score display, checklist, both download buttons
- Free tools: PDF Compressor, Spine Width Calculator, Cover Size Calculator, Royalty Calculator, Banned Keyword Checker, Page Count Estimator, Trim Size Comparison, Interior Template
- Annotation colors: red/yellow/green in viewer and downloaded PDF
- Railway auto-deploys from GitHub main branch

### IN TEST MODE — do not switch live yet

- Lemon Squeezy: TEST mode, variant ID 1346943, store ID 301866
- Store name still shows "ScribeStack" — needs fixing before go-live

### NOT YET BUILT

- Resend email system (priority 1 before go-live)
- Scan credit packs (Author $19, Indie $39, Pro $79) — Lemon Squeezy products not created yet
- platform_waitlist table created in Supabase, PlatformWaitlistForm component live

---

## Open Technical Risks

1. **Score path inconsistency**: download page uses `severity+advanced`; `printReadyCheckProcess` uses `fixDifficulty===advanced` only — can diverge
2. **Two scan paths** (`kdp-pdf-check` direct vs async R2 via `kdp-pdf-check-from-preflight`) may store slightly different score data
3. **Legacy reports**: if `issuesEnriched` missing but `issues[]` exists, score fallback may show wrong value
4. **Railway**: Python changes only live after kdp-preflight-engine redeploys from same commit

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Homepage |
| `src/app/kdp-pdf-checker/page.tsx` | Upload/checker page |
| `src/app/download/[id]/page.tsx` | Results/download page |
| `src/lib/printReadyCheckProcess.ts` | Async scan worker (R2 path) |
| `src/app/api/kdp-pdf-check/route.ts` | Direct upload scan path |
| `src/app/api/kdp-pdf-check-from-preflight/route.ts` | R2 async path entry |
| `src/lib/kdpReportEnhance.ts` | Scoring, enrichment, deduplication |
| `src/components/SiteNav.tsx` | Navigation |
| `src/components/SiteFooter.tsx` | Footer |
| `kdp-preflight-engine/app/core/validation_report.py` | Python scoring |
| `kdp-preflight-engine/app/core/pdf_parser.py` | PDF parsing, image detection |
| `kdp-preflight-engine/app/rules/page_rules.py` | KDP rules engine |
| `kdp-preflight-engine/app/tasks/annotate_pdf.py` | PDF annotation with red/yellow/green colors |

---

## Design System

| Token | Value |
|-------|-------|
| Ivory | `#FAF7EE` |
| Orange | `#F05A28` |
| Green | `#2D6A2D` |
| Near-black | `#1A1208` |
| Sage | `#E8F0E8` |
| Deep green (pricing) | `#1A3A2A` |
| Display font | Bebas Neue |
| Body font | System font stack |

Tailwind custom tokens: `m2p-ivory`, `m2p-ink`, `m2p-orange`, `m2p-muted`, `m2p-live`, `m2p-border`

---

## Go-Live Checklist

- [ ] Resend email: send download link after payment
- [ ] Lemon Squeezy: switch to live mode
- [ ] Fix store name: ScribeStack → manu2print
- [ ] QA all free tool pages
- [ ] Create scan credit pack products in Lemon Squeezy

---

## Next Session Priorities

1. Resend email system — post-payment download link delivery
2. Lemon Squeezy live mode + store name fix
3. Score path alignment (two scan paths)
4. Individual free tool page QA and design pass

---

## Workflow

Claude Code or Cursor agent writes code → Zed pastes/runs → agent builds → Zed reports → repeat.

- Never test on localhost. Always verify on https://www.manu2print.com after deploy.
- Never touch `LayoutForge-main/` folder — not a conflict, leave it.
- Lemon Squeezy stays in TEST mode until Resend email is confirmed working.
