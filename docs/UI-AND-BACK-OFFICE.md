# UI, Back Office, and Payment Flows — Checklist & Best Practices

One place for: what to check and create (user UI, admin UI, payment flows, database), and how to keep it simple, clear, and pre-emptive.

---

## 1. User-facing UI — What to check and create

| Area | Check / Create | Pre-emptive idea |
|------|----------------|------------------|
| **Navigation** | Same nav pattern on all tool pages (manu2print logo, Tools, platform link). No dead links. | Breadcrumb or “Back to KDP tools” on long flows. |
| **Free tools** | Clear “FREE” badge; CTAs after use (“Try KDP Formatter”). Copy explains what happens next. | One primary CTA per page so the next step is obvious. |
| **Paid tools** | Price visible before upload ($7 / $27). PaymentGate copy: “Your file is ready — choose how to access.” Beta code path visible. | Short “What happens next” (3 steps) on upload page. |
| **Upload / progress** | File type and size limits shown. Progress bar and label during upload/convert. Error messages actionable. | “Max 50MB” and “DOCX only” in placeholder and error. |
| **Download / success** | Success page confirms payment and links to download. Download page shows report and one clear “Download” button. | If verify-access is slow, show “Confirming…” and retry link. |
| **Forms** | Labels, placeholders, validation messages. No unlabeled inputs. | Inline hint (e.g. “We’ll only use this for your receipt”). |
| **Mobile** | Tap targets ≥ 44px; text readable without zoom. Tables scroll horizontally where needed. | Stack form fields vertically; primary button full-width on small screens. |
| **Accessibility** | Buttons and links have clear purpose (no “Click here”). Contrast meets WCAG AA where possible. | `aria-label` on icon-only buttons; focus visible. |

**Create if missing:** Consistent “What happens next” on every paid-tool upload page; error recovery (e.g. “Try again” or “Contact support”); optional “Save this link” note on download page (e.g. email with link).

---

## 2. Admin back office — What exists and what to check

### 2.1 What exists today

| Piece | Purpose |
|-------|---------|
| **`/admin`** | Password (ADMIN_PASSWORD). Dashboard: total revenue, paying customers, active subscriptions, beta users. Tables: recent payments, subscriptions, beta usage. Refresh / Log out. |
| **`GET /api/admin/stats`** | Auth: `x-admin-password` = ADMIN_PASSWORD. Returns aggregates + recentPayments, subscriptions, betaUsage from Supabase. |
| **`GET /api/admin/leads`** | Auth: ADMIN_SECRET (Bearer or ?secret=). Returns leads from storage (manuscript meta with leadEmail + any file-based leads). |
| **`GET /api/admin/emails`** | Auth: `x-admin-key` = ADMIN_SECRET. Returns all rows from Supabase `email_captures` (e.g. PDF Compressor). |
| **`GET /api/admin/payments`** | Same password as stats; different response shape. (Admin page uses **stats**, not payments.) |

**Database (Supabase):** `payments`, `subscriptions`, `beta_access`, `profiles`, `usage_events`, `formatter_leads`, `platform_notifications`, `founder_applications`, `email_captures`.

**File storage:** Uploads and outputs under `data/uploads` (or Vercel `/tmp`); meta in `{id}.meta.json`; outputs in `out/{id}/`.

### 2.2 What to check and create (admin)

| Area | Check | Create if missing |
|------|--------|-------------------|
| **Auth** | Admin uses password only (no 2FA). Stored in sessionStorage for refresh. | Optional: separate ADMIN_SECRET for API-only access; rate-limit admin routes. |
| **Single entry point** | One admin page with tabs or sections: Stats, Payments, Subscriptions, Beta, Leads, Emails. | Unify: either add Leads/Emails to current `/admin` or link to a second “Leads” page that uses ADMIN_SECRET. |
| **Payments table** | Columns: email, tool, payment_type, amount, status, gateway, created_at. Show gateway (e.g. Lemon Squeezy). | Add `gateway_order_id` or link to Lemon Squeezy dashboard if needed for disputes. |
| **Revenue** | Only “complete” payments counted. Amount in cents. | Clarify in UI: “Revenue = completed one-time + subscription (if you track that).” |
| **Leads** | Two sources: (1) storage `listLeads()` (leadEmail on manuscript meta), (2) Supabase `email_captures` / `formatter_leads`. | One “Leads” view that merges or tabs: Compressor emails, Formatter signups, manuscript leads. |
| **Export** | No CSV/export yet. | Optional: “Export payments (CSV)” and “Export leads (CSV)” for accountant or CRM. |
| **Pre-emptive** | Dashboard shows “No payments yet” / “No subscriptions” so it’s obvious when empty. | Add “Last webhook: …” or “Latest payment: …” so you can see if webhooks stopped. |

---

## 3. Payment flows — End-to-end and best practices

### 3.1 User payment flow (current)

1. User uses a paid tool → upload → conversion → redirect to `/download/{id}?source=...`.
2. Download page shows PaymentGate (blur + overlay). User enters email, picks $7 one-time or $27/6 months, or beta code.
3. **$7 / $27:** `POST /api/create-checkout-session` with tool, downloadId, email → Lemon Squeezy checkout URL → redirect to Lemon Squeezy.
4. After payment, Lemon Squeezy redirects to `NEXT_PUBLIC_APP_URL/success?id={downloadId}`.
5. Success page: “Payment successful” + calls `POST /api/verify-access` with downloadId → if access, show “Download your file” → link to `/download/{id}`.
6. **Webhook:** Lemon Squeezy sends `order_created` to `POST /api/webhooks/lemonsqueezy`. We verify signature, insert into `payments` (and `subscriptions` if 6-month), then `markDownloadPaid(downloadId)` so the download is unlocked.

### 3.2 What to check (payment)

| Check | Why |
|-------|-----|
| **Webhook URL** | In Lemon Squeezy: Webhook URL = `https://your-domain.com/api/webhooks/lemonsqueezy`. Must be HTTPS and correct env (e.g. production). |
| **Signature** | We verify `x-signature` with `LEMONSQUEEZY_WEBHOOK_SECRET`. Never skip; prevents fake “order_created”. |
| **Idempotency** | If webhook fires twice, we insert payments twice. Optional: dedupe by `gateway_order_id` (unique) or ignore duplicate `order_created` for same order id. |
| **markDownloadPaid** | After insert, we call `markDownloadPaid(downloadId)` so the user can download. If this fails, user paid but download stays locked — log and retry or alert. |
| **Success page** | Uses `id` from query; calls verify-access. If webhook is slow, access might not be true yet — current “Confirming…” and “Open download page” handle that. |

### 3.3 Best practices (payment + DB)

| Practice | How |
|----------|-----|
| **One source of truth** | Payments live in Supabase `payments`. Revenue = sum of completed payments. Don’t derive revenue from Lemon Squeezy only; we record what we unlocked. |
| **User’s “purchases”** | We don’t have a user account required for purchase. Access is by email + downloadId (verify-access checks payment_confirmed on meta, or subscriptions by email). For “my purchases” later, you’d query payments by email. |
| **Admin view of payments** | Admin dashboard shows recent payments and subscriptions. For disputes, keep `gateway_order_id` and link to Lemon Squeezy order (e.g. `https://app.lemonsqueezy.com/orders/...`). |
| **Refunds** | Handled in Lemon Squeezy. We don’t auto-revoke access on refund. Optional: webhook for `order_refunded` → set payment status or revoke that download’s access. |
| **Beta and subscription** | Beta: code in env; beta_verify writes to `beta_access`. Subscription: webhook inserts into `subscriptions` with current_period_end. verify-access checks both. |

---

## 4. Database (Supabase) — Quick reference

| Table | Purpose |
|-------|---------|
| **payments** | One row per Lemon Squeezy order (email, tool, payment_type, amount, status, gateway, gateway_order_id, created_at). |
| **subscriptions** | One row per 6-month purchase (email, status, plan, current_period_end). Used by verify-access. |
| **beta_access** | Beta code uses (email, tool). Used by verify-access and shown in admin. |
| **email_captures** | PDF Compressor (and similar) signups. |
| **formatter_leads** | Formatter page signups (name, email). |
| **profiles / usage_events** | Auth and usage if you use Supabase auth and paywall. |

**Best practice:** Run migrations in order (001 → 004). Back up Supabase (point-in-time or exports) before schema changes. Use env for all secrets (ADMIN_PASSWORD, ADMIN_SECRET, LEMONSQUEEZY_WEBHOOK_SECRET); never commit them.

---

## 5. Is this a “big job”?

**No, if the goal is:**  
Documentation + a single checklist and light audit (e.g. confirm webhook URL, add Leads/Emails to admin if you want them in one place).

**Medium, if the goal is:**  
- Unify admin (one place for stats, payments, subscriptions, beta, leads, emails).  
- Add idempotency or refund webhook.  
- Add CSV export for payments/leads.  
- Small UI passes (success page copy, “What happens next” on every paid tool).

**Not a full rewrite:** Payment flow and DB are already in place; this doc is the map and the checklist so you can tick off “checked” and “created” as you go.
