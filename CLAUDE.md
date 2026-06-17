\# Project: Manu2Print



Next.js 15 (App Router) + TypeScript + Tailwind CSS. Browser-based KDP publishing toolkit for indie authors.

Deployed on Vercel. Repo: QZEE777/LayoutForge.



\---



\## Commands



\- `npm run dev` — start dev server

\- `npm run build` — production build

\- `vercel --prod` — deploy to production (only when instructed)



Never deploy without explicit instruction from Zed.



\---



\## Stack



\- \*\*Frontend:\*\* Next.js 15 App Router + TypeScript + Tailwind CSS

\- \*\*Database:\*\* Supabase (Postgres)

\- \*\*File Storage:\*\* Cloudflare R2 — bucket: `manu2print-uploads`

\- \*\*Backend Workers:\*\* Railway

&#x20; - `kdp-preflight-engine` (Python/FastAPI) — PDF scanning

&#x20; - `clever-magic` (Node/TSX) — annotation worker

\- \*\*Payments:\*\* Lemon Squeezy

\- \*\*Email:\*\* Resend

\- \*\*Hosting:\*\* Vercel



\---



\## File Upload Architecture (NON-NEGOTIABLE)



```

Browser → R2 Presigned URL → Cloudflare R2 → Railway Worker → Supabase

```



Never route large file uploads through Vercel directly. Never use Render. This is fixed and permanent.



\---



\## Hard Constraints



\- Vercel serverless functions have a \*\*60-second hard timeout\*\*. Any task longer than this must be async — return a `jobId` immediately, worker processes, frontend polls a status endpoint.

\- AWS SDK v3 adds CRC32 checksum parameters that R2 rejects — strip these via URL filter.

\- `mammoth.js` is \*\*banned\*\*. Do not use it.

\- Never push to GitHub mid-session unless Zed explicitly instructs it.

\- No credentials in code. Ever.

\- Always test on `https://www.manu2print.com` — never localhost.

\- One targeted fix at a time. Verify live before moving to the next change.



\---



\## Architecture



\- `src/app/` — Next.js App Router pages and layouts

\- `src/app/api/` — API route handlers

\- `src/components/` — shared UI components

\- `src/lib/` — utilities, Supabase client, R2 helpers

\- `public/` — static assets (book covers, Manny mascot poses)



\---



\## Routing \& Component Conventions



\- App Router only. No Pages Router patterns.

\- Server Components by default. Only add `"use client"` when interactivity is required.

\- No `getServerSideProps` or `getStaticProps`.

\- Data fetching in Server Components — query Supabase directly, don't call APIs from Server Components.

\- Never trust client-provided user IDs — always derive from session or token.



\---



\## Design System



\- Background: `#FAF7EE` (ivory)

\- Primary CTA: `#F05A28` (Brave-orange)

\- Text: `#1A1208` (near-black ink)

\- Display typeface: Bebas Neue

\- Tailwind CSS only — no inline styles, no CSS Modules

\- Use `cn()` for conditional class merging



\---



\## Supabase



\- Never instantiate a new client inline — use the shared client from `src/lib/supabase`

\- Schema changes require a migration — never alter tables directly in production

\- Download records, scan metadata, email logs all live in Supabase



\---



\## Working With Zed (CRITICAL)



\- Zed is non-technical. He directs. You execute.

\- One change at a time. Wait for confirmation before the next step.

\- No "find this line" instructions — provide exact file paths and complete replacement blocks.

\- If a task deviates from spec — stop and flag it. Do not patch around it.

\- Structural solutions only. No cosmetic fixes that mask real problems.

\- Copy-paste ready output always.

\- Test with real file sizes (28MB+). No toy examples.



\---



\## DO NOT



\- Do not use Render — permanently removed from stack

\- Do not use mammoth.js

\- Do not add a download button for annotated PDFs — delivery is email-only (intentional marketing touchpoint)

\- Do not push to GitHub without explicit instruction

\- Do not deploy without explicit instruction

\- Do not mix Pages Router and App Router patterns

\- Do not make autonomous fixes to things Zed hasn't flagged

\- Do not add `"use client"` unless browser APIs are genuinely required



\---



\## Current Tool Inventory



\*\*Paid:\*\*

\- Tool 1: Print Ready Check (`/kdp-pdf-checker`) — $9/scan — LIVE

\- Tool 2: KDP PDF Formatter — coming soon



\*\*Free:\*\*

\- PDF Compressor, Spine Width Calculator, Cover Size Calculator, Royalty Calculator

\- Banned Keyword Checker, Page Count Estimator, Trim Size Comparison, Interior Template



\*\*Coming Soon:\*\*

\- DOCX Manuscript Formatter



\---



\*Update this file when stack, tools, or constraints change.\*

\*Last updated: May 2026\*

