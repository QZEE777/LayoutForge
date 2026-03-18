# Ship live checklist (manu2print / LayoutForge)

Use this before and after deploying to Vercel.

## Before deploy

- [ ] **Build passes:** `npm run build` (no type or build errors).
- [ ] **Env on Vercel:** All required vars from `.env.example` set in Vercel (Settings → Environment Variables). Include at least:
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - App: `NEXT_PUBLIC_APP_URL`, `ENCRYPTION_KEY`, `ADMIN_PASSWORD_MANU2`
  - Payments: Lemon Squeezy vars if paywall is on
  - Sentry (optional): `NEXT_PUBLIC_SENTRY_DSN`; for source maps add `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
  - KDP checker: `KDP_PREFLIGHT_API_URL`, `NEXT_PUBLIC_KDP_PREFLIGHT_API_URL` if using preflight engine
- [ ] **No secrets in code:** All keys from env only.

## After deploy

- [ ] Homepage and key tools load.
- [ ] Auth (sign in / sign out) works.
- [ ] If Sentry DSN is set: trigger a test error and confirm it appears in Sentry.

- [ ] **Security:** No secrets in code; production uses explicit env (see `docs/SECURITY.md`).

## Note: nested folder

If you have a copy of the repo inside the repo (e.g. `LayoutForge-main/LayoutForge-main/`), it’s excluded in `tsconfig.json` so the build uses a single Next.js. You can delete the inner copy to avoid confusion.
