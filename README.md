# Manu2Print — KDP-focused author tools

**Transform how authors publish on Amazon KDP** — PDF checker, formatter, keyword research, description generator, and related tools. Live at layout-forge.vercel.app (manu2print).

---

## Project status

**Current status:** See **[docs/STATUS.md](docs/STATUS.md)** for work completed, security check, and pending items.

**Shipped:** KDP PDF Checker, KDP Formatter (DOCX→PDF), Keyword Research (PDF), Description Generator, PDF Compressor (free), Print Optimizer (free), cover/spine/trim tools. Auth and profile via Supabase; payments via Lemon Squeezy ($7 per use / $27 for 6 months).

**Docs:** [docs/MANU2PRINT-KDP.md](docs/MANU2PRINT-KDP.md) — formatter pipeline. [docs/TODO.md](docs/TODO.md) — saved task list.

---

## Quick start

**New machine / restore context:** [MIGRATION.md](MIGRATION.md), [docs/CONTINUE-PROJECT.md](docs/CONTINUE-PROJECT.md).

### Development

```bash
npm install
# Copy .env.example to .env.local and set env vars (no secrets in repo)
npm run dev
```

Visit `http://localhost:3000`.

### Production

Push to GitHub → auto-deploys to Vercel. All secrets from environment (Vercel env vars); never commit keys.

---

## Security

- **Secrets:** All from `process.env`; no API keys or passwords in code.
- **Auth:** Supabase (magic link); session server-side; rate-limited.
- **Admin:** Routes gated by `ADMIN_PASSWORD_MANU2`; rate-limited per IP.
- **Payments:** Lemon Squeezy; webhook signature verified with `LEMONSQUEEZY_WEBHOOK_SECRET`.
- **Profile:** RLS; users update only their own row; client only updates `first_name`.
- **Free tools:** PDF Compressor / Print Optimizer run client-side only (no server file upload).

---

## Tech stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** Next.js API routes, TypeScript
- **Auth & DB:** Supabase (PostgreSQL, auth, RLS)
- **Payments:** Lemon Squeezy
- **AI:** Anthropic (Claude) for keyword research, description generator
- **Files:** pdf-lib, pdfjs-dist, docx, mammoth, CloudConvert (paid flows only)
- **Deploy:** Vercel

---

## Project structure (high level)

```
src/
├── app/           # Pages & API routes (dashboard, tools, download, api/*)
├── lib/           # Utilities (encryption, KDP generator, Supabase, etc.)
├── components/    # Shared UI
docs/              # STATUS.md, TODO.md, product/legal/ROE docs
ai-knowledgebase/  # Static product/feature docs for AI/support
```

---

## Environment

Use **.env.example** as reference. Copy to `.env.local` for local dev. Set all variables in Vercel for production. Never commit `.env` or real keys.

---

## Docs

- **[Status](docs/STATUS.md)** — Current state, security check, pending once/later
- **[TODO](docs/TODO.md)** — Saved task list
- **[ROE](docs/ROE-PROTOCOL.md)** — Rules of engagement
- **[Manu2Print KDP](docs/MANU2PRINT-KDP.md)** — Formatter pipeline
- **[Free tools cost](docs/FREE-TOOLS-COST.md)** — What runs client-side vs paid APIs

---

**Last updated:** March 2026
