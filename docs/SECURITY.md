# Security & safety (manu2print / LayoutForge)

Decisions and checks for deployment and operations.

## Principles

- **No secrets in code.** All API keys, passwords, and tokens come from `process.env` (Vercel / `.env.local`). Never commit them.
- **Production requires explicit secrets.** In production, missing `ENCRYPTION_KEY` or Supabase config causes a clear error or 503, not a fallback key or silent failure.
- **Admin and webhooks are explicitly gated.** Admin APIs and webhook handlers validate credentials before doing anything.

## Auth & access

| Area | Mechanism | Notes |
|------|-----------|--------|
| **Admin APIs** (`/api/admin/*`) | `x-admin-password` header = `ADMIN_PASSWORD_MANU2`, or (where supported) `ADMIN_SECRET` (Bearer / query). | Timing-safe compare; 503 if password not configured. |
| **Lemon Squeezy webhook** | `x-signature` HMAC-SHA256 with `LEMONSQUEEZY_WEBHOOK_SECRET`. | Reject if missing or invalid. |
| **Download / report by ID** | Unguessable UUID in path. | No auth on API; access control is “who has the link” + PaymentGate on front. |
| **User session** | Supabase Auth (magic link); middleware refreshes session. | Service role used only server-side for DB. |

## Env & secrets

- **Required in production:** `ENCRYPTION_KEY` (64 hex chars), `ADMIN_PASSWORD_MANU2`, Supabase URL + anon key (and service role for backend). R2 vars if using R2 uploads.
- **Never in client bundle:** `SUPABASE_SERVICE_ROLE_KEY`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `ADMIN_PASSWORD_MANU2`, `ENCRYPTION_KEY`, R2 keys, CloudConvert/Anthropic keys. Only `NEXT_PUBLIC_*` and anon key are safe in the browser.
- **Diagnostic endpoints:** `/api/cc-test` returns 404 in production.

## Validation

- **Admin password/secret:** Constant-time comparison (`timingSafeEqualStrings`) to prevent timing attacks.
- **File types:** Download API allows only `.pdf`, `.docx`, `.epub`.
- **Input:** Request bodies and query params validated and trimmed; no raw injection into DB or storage.

## Before each deploy

- [ ] All secrets set in Vercel (no placeholders in production).
- [ ] `ENCRYPTION_KEY` is 64 hex characters.
- [ ] `ADMIN_PASSWORD_MANU2` is set if you use `/admin`.
- [ ] Run `npm run build`; fix any type or lint errors.

See also: `.cursor/rules/layoutforge-stack-and-security.mdc`, `docs/SHIP-LIVE-CHECKLIST.md`.
