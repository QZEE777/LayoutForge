# ScribeStack – Stack Audit

**Live:** https://layout-forge.vercel.app  
**Last audit:** handoff session.

---

## Tools & APIs

| Tool | Route | API / Env | Status |
|------|--------|-----------|--------|
| KDP Formatter | `/kdp-formatter` | `/api/upload`, `/api/generate`, `/api/generate/status`, `/api/download/[id]/[filename]`, `/api/preview-pdf/[id]` | CloudConvert: `CLOUDCONVERT_API_KEY` |
| 7 Keyword Research | `/keyword-research` | `/api/keyword-research` | Anthropic: `ANTHROPIC_API_KEY`, model `claude-haiku-4-5-20251001` |
| Amazon Description Generator | `/description-generator` | `/api/description-generator` | Anthropic: `ANTHROPIC_API_KEY`, model in route (consider aligning with keyword-research) |
| Kindle EPUB Maker | `/epub-maker` | — | Placeholder (Coming soon) |
| KDP Royalty Calculator | `/royalty-calculator` | — | Placeholder (Coming soon) |

---

## API Routes Summary

| Path | Purpose | Env |
|------|---------|-----|
| `POST /api/upload` | Store file; return id | — (uses `/tmp` or `data/uploads`; rate limit 10/min) |
| `POST /api/generate` | Start CloudConvert job (KDP PDF) | `CLOUDCONVERT_API_KEY` |
| `GET /api/generate/status?id=` | Poll job status | `CLOUDCONVERT_API_KEY` |
| `GET /api/download/[id]/[filename]` | Download converted file | — |
| `GET /api/preview-pdf/[id]` | Preview PDF | — |
| `POST /api/keyword-research` | 7 keywords from excerpt | `ANTHROPIC_API_KEY` |
| `POST /api/description-generator` | Amazon description + SEO + BISAC | `ANTHROPIC_API_KEY` |
| `GET /api/cc-test` | CloudConvert connectivity test | `CLOUDCONVERT_API_KEY` |
| `POST /api/parse` | (if used) | — |
| `POST /api/metadata/optimize` | (if used) | — |

---

## Vercel env vars to verify

- `ANTHROPIC_API_KEY` – for keyword-research and description-generator.
- `CLOUDCONVERT_API_KEY` – for KDP Formatter (generate + status + cc-test).
- `ENCRYPTION_KEY` – if used by `src/lib/encryption.ts` (e.g. download tokens).
- `NEXT_PUBLIC_API_URL` – optional; defaults to same origin. Used in middleware.

---

## Description generator model

- Both `description-generator` and `keyword-research` use `claude-haiku-4-5-20251001`.

---

## Checklist (run on live after deploy)

1. [ ] KDP Formatter: upload → generate → download full flow.
2. [ ] 7 Keyword Research: upload DOCX/PDF → get 7 keywords.
3. [ ] Amazon Description Generator: upload → get description + keywords + BISAC.
4. [ ] Vercel → Project → Settings → Environment Variables: all above keys set for Production (and Preview if needed).
5. [ ] Vercel → Deployments → latest → Functions / Runtime Logs: no 503/502 from missing keys or upstream errors.
