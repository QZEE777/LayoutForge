# Continue manu2print / layoutforge on a New Machine

After migrating (see repo root **MIGRATION.md**), use this so the AI keeps the same project context and style.

---

## Prompt for Cursor (paste into a new chat)

Copy the block below and paste it as the **first message** in a new Cursor chat when you open this project on the new laptop. Then continue with your usual requests.

```
This is the manu2print (layoutforge) project. I've just migrated to a new laptop.

Context:
- Product: manu2print — KDP & Kindle only. Tools: formatting, PDF checker, keyword research, description generator, Kindle EPUB, free calculators/compressors. Free tools client-side or email-only; paid tools $7 per use or $27 for 6 months. Supabase auth + Lemon Squeezy; Anthropic for AI; CloudConvert for paid PDF/EPUB.
- Stack: Next.js 15 (App Router), React 19, TypeScript, Vercel. See .cursor/rules/layoutforge-stack-and-security.mdc and scribestack-working-style.mdc in the repo.
- Working style: I'm the ideas person; you implement and maintain. Prefer acting over proposing. Only ask when a real decision is needed (API keys, business/UX, spend).
- Key paths: Home src/app/page.tsx; Formatter hub src/app/formatter/page.tsx; Founders src/app/founders/page.tsx; platform hub src/app/platform/[platformId]/page.tsx; tools data src/data/platformTools.ts. Back office / admin and APIs under src/app/api.

Please continue helping with this codebase as before. If you need to run commands, use PowerShell on Windows.
```

---

## Optional: one-line reminder

If you don’t want to paste the full block every time, you can start a chat with:

**“This is the manu2print/layoutforge repo — KDP & Kindle tools, Next.js 15, Supabase, Lemon Squeezy. Continue in the same style as before (see .cursor/rules).”**

Then ask your real question in the next message.
