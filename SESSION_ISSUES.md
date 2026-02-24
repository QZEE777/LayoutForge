# Session issues – fix and move on

**Project:** LayoutForge (ScribeStack) – KDP manuscript → PDF (CloudConvert), metadata, keyword/description tools.

---

## 1. Vercel build failing (blocker)

- **What:** Deployments on Vercel (project “layout-forge”) are failing.
- **Done so far:** `.npmrc` with `legacy-peer-deps=true` was added; build still fails.
- **Need from you:** Build logs from the **latest failed** deployment:
  - Vercel dashboard → **Deployments** → click the failed deploy → **Build logs** (or “View build logs”).
  - Copy the **exact error** (last 20–30 lines is enough).
- **Next:** Once we have that error, we fix the build (e.g. Node version, install command, or dependency changes).

---

## 2. Phase 1 (auth/billing) not wired

- **What:** Code exists for encryption, rate limiting, security helpers, dashboard placeholder. **Clerk, Prisma, Stripe are not in the app** (not in `package.json`; root layout has no `ClerkProvider`).
- **So:** Auth/sign-in and paid dashboard are not active. Dashboard at `/dashboard` is a static placeholder.
- **When to fix:** After Vercel build is fixed. If you want sign-in and billing, we add Clerk + DB + Stripe per `ACTION_CHECKLIST.md` and wire env in Vercel.

---

## 3. Metadata optimizer “mimics input”

- **What:** “Optimize for KDP” is a simple keyword/category suggester; it does **not** use the full manuscript or AI.
- **Later:** Use full manuscript + AI (e.g. Gemini) for description/keywords and optional competitor data (Phase 2).

---

## Quick reference

| Item              | Status / action                                      |
|------------------|-------------------------------------------------------|
| PDF generation   | CloudConvert (DOCX/PDF/EPUB → PDF); needs `CLOUDCONVERT_API_KEY` |
| Upload/preview   | Working (rate limit: 10 uploads/min, 100 API/min)    |
| Download         | Working (PDF + Calibre note for EPUB)                |
| Metadata editor  | Working; optimizer is simple (no AI yet)             |
| Vercel deploy    | **Failing – need build logs to fix**                  |
| Phase 1 auth     | Not wired (no Clerk/DB/Stripe in app)                 |

---

**This session:** Get Vercel build logs → fix build → then optionally Phase 1 env or Phase 2 AI.
