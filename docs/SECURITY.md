# Security & safety checklist

This document summarizes how we keep the source and product safe.

## Secrets and configuration

- **No hardcoded secrets.** All API keys, passwords, and tokens are read from environment variables (e.g. `process.env.ANTHROPIC_API_KEY`, `ADMIN_PASSWORD_MANU2`, `ADMIN_SECRET`).
- **Env files ignored.** `.env`, `.env.local`, and similar are in `.gitignore`; never commit them.
- **Public vs server.** Only non-sensitive config is exposed via `NEXT_PUBLIC_*`; secrets stay server-side.

## Admin authentication

- **Admin routes** (`/api/admin/*`) require either:
  - Header `x-admin-password` equal to `ADMIN_PASSWORD_MANU2`, or (where supported) `x-admin-key` / Bearer / `?secret=` equal to `ADMIN_SECRET`.
- **Timing-safe comparison.** Admin password and secret checks use constant-time comparison (`timingSafeEqualStrings` in `src/lib/security.ts`) to reduce timing-attack risk.
- **Rate limiting.** Admin endpoints are rate-limited via `src/lib/rateLimitAdmin.ts`.

## Input validation and injection

- **Preflight `jobId`.** In `kdp-pdf-check-from-preflight`, the request `jobId` is validated as a UUID before being used in report/file URLs to prevent path traversal or injection.
- **Sanitization.** Use `sanitizeInput` and schema validation where user input is reflected or used in queries.

## Logging and information leakage

- **No logging of secrets.** We do not log API key values, lengths, or any credential material.
- **Audit.** Security-relevant events can be logged via `logAuditEvent` without including sensitive data.

## Security headers

- **Response headers.** `setSecurityHeaders` in `src/lib/security.ts` sets hardening headers (e.g. X-Content-Type-Options, X-Frame-Options, Referrer-Policy).

## Operational reminders

1. Rotate `ADMIN_PASSWORD_MANU2` and `ADMIN_SECRET` if they may have been exposed.
2. Keep dependencies updated and run `npm audit` periodically.
3. If adding new admin or authenticated routes, use the same timing-safe auth and rate limiting patterns.
