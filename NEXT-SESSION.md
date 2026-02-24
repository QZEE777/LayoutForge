# Next Session – ScribeStack (LayoutForge)

Handoff for when you return. Machine left on; keyword generator confirmed working.

---

## 1. Check current stack on the website

- **Suspect**: Some tools/APIs may not be working properly in production.
- **Do**: Audit live site and each tool/API:
  - KDP Formatter (CloudConvert) – env: `CLOUDCONVERT_API_KEY`
  - 7 Keyword Research – env: `ANTHROPIC_API_KEY`, model: `claude-haiku-4-5-20251001`
  - Amazon Description Generator – env: `ANTHROPIC_API_KEY`
  - Other APIs: `/api/generate`, `/api/upload`, `/api/parse`, `/api/cc-test`, preview-pdf, download, metadata/optimize
- Verify env vars in Vercel, test each flow on layout-forge.vercel.app, check server logs for errors.

---

## 2. Build out apps/components/tools as placeholders

- **Live**: KDP Formatter, 7 Keyword Research, Amazon Description Generator.
- **Placeholders** (currently “Coming soon”): Kindle EPUB Maker (`/epub-maker`), KDP Royalty Calculator (`/royalty-calculator`).
- Ensure placeholder pages exist and match site style; add clear “Coming soon” UI and any stub components so the stack is consistent.

---

## 3. DYOR: Affiliate element

- Research how to add an affiliate element (e.g. Amazon KDP/Associates, book tools, etc.) in a way that fits the product and is compliant.
- Options: links in tool results, dedicated “Resources” section, footer links. Document options and recommend one.

---

## 4. Security – stack and users

- **Stack**: Review env usage (no keys in client), API routes (auth/rate limits if needed), dependency audit (`npm audit`), Vercel project settings.
- **Users**: File uploads (types, size limits, sanitization), no PII in logs, HTTPS only. Consider short retention for uploaded files if applicable.

---

## Reference

- **Repo**: layoutforge (main branch).
- **Live**: https://layout-forge.vercel.app
- **Working style**: See `.cursor/rules/scribestack-working-style.mdc` (ideas guy / coder; minimal input; AI does everything possible).
