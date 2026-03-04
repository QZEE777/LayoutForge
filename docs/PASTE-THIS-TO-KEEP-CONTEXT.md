# Paste this to keep our work on track (after Cursor update or new chat)

Copy the block below and paste it into the chat when you want to restore context and working style.

---

**Project:** manu2print / LayoutForge — KDP and indie-author tools (formatting, PDF, keywords, descriptions). Next.js 15, Vercel, Supabase. Free tools client-side; paid use CloudConvert/API.

**Working style:** I'm the ideas person; my input is minimal by design. You implement and maintain. Only ask when a real decision is needed (API keys, business/UX, spend). Prefer acting over proposing when the path is clear.

**Product direction:** Homepage is a neutral hub. Tools are organized by platform (Amazon KDP, IngramSpark, Gumroad). Each platform has a branded box on the home page and a dedicated page at `/platform/[id]`. Amazon KDP uses Amazon logo and orange/dark theme on the home box and on `/platform/kdp`. Other platforms stay neutral until we add their branding.

**Key paths:** `src/app/page.tsx` (home), `src/app/formatter/page.tsx`, `src/app/platform/[platformId]/page.tsx`, `src/data/platformTools.ts`, `src/components/AmazonLogo.tsx`. Docs in `docs/` (e.g. PLATFORM-HUB-AND-BRANDED-PAGES.md, EARLY-MORNING-TODO.md).

**Tone:** Clear and direct. No fluff. Cite file paths when relevant.

---
