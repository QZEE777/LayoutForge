# Status (review while you were away)

**Last updated:** Session review. No code or config changed — status and security check only.

---

## Work completed (this branch)

| Area | Status |
|------|--------|
| **Dashboard** | Free tools + Paid tools from `platformTools`; Profile link; Log out. |
| **Profile** | `/dashboard/profile` — first name (saved to `profiles.first_name`), email read-only. Migration 007 adds column. |
| **Docs** | `UI-AND-BACK-OFFICE.md` §6: profile, AI email strategy, brand voice (§6.4), behavior layer (§6.5), style anchors (§6.6), product facts note. `PRODUCT-FACTS.md` for support/AI. |
| **AI knowledge base** | `ai-knowledgebase/` — `product_overview.md`, `features.md`, `workflows.md`. Static; not connected. Update manually when product changes. |
| **Support** | Not set up yet. Reminder in §6; LEGAL_OR_THREAT template points to official support. |

---

## Security check (quick pass)

| Check | Result |
|-------|--------|
| **Secrets** | All from env (`process.env.*`). No hardcoded API keys or passwords in repo. |
| **Admin** | Auth via `ADMIN_PASSWORD_MANU2`; trim on compare; 503 if not configured, 401 if wrong. Admin routes use `checkAdminRateLimit`: 30 req/min per IP. |
| **Webhook** | Lemon Squeezy signature verified with `LEMONSQUEEZY_WEBHOOK_SECRET`; no verification skipped. |
| **Profile** | Client updates only `first_name`; RLS limits to `auth.uid() = id`. User cannot update other users’ rows. |
| **Auth** | Magic link rate-limited. Supabase handles session; no secrets in client. |

**No issues found.** No code or config was modified in this review.

---

## What “Service Unavailable” (503) means

When you see **503** or **“Service Unavailable”**, the server is saying: *this feature is turned off because a required setting is missing.*

The app returns 503 when:

| If you see 503 on… | Cause | Fix |
|--------------------|--------|-----|
| **Admin** (`/admin`) | `ADMIN_PASSWORD_MANU2` not set in Vercel | Add it in Vercel → Project → Settings → Environment Variables. |
| **Keyword Research / Description Generator / KDP Format Review** | `ANTHROPIC_API_KEY` not set | Add it in Vercel (from console.anthropic.com). |
| **Checkout / Payment** | `LEMONSQUEEZY_API_KEY` or `LEMONSQUEEZY_STORE_ID` or variant IDs not set | Add all Lemon Squeezy env vars in Vercel. |
| **Usage banner / Dashboard usage** | Supabase URL or key not set | Add `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (and anon key) in Vercel. |
| **KDP Formatter (DOCX→PDF)** | `CLOUDCONVERT_API_KEY` not set | Add it in Vercel (or use fallback if implemented). |

So: **503 = “this endpoint needs an env var you haven’t set (or that isn’t available in this environment).”** Check Vercel env vars for the feature that’s failing.

---

## Pending: do once

### Migration 007 (first_name) — done

You ran the SQL in Supabase; "Success. No rows returned" confirmed. `profiles.first_name` is live. Steps below are kept for reference or for a fresh project.

**Reference — run once per project:**

Profile page saves first name to `profiles.first_name`. Run this once in Supabase.

**Step 1.** Open your browser and go to: **https://supabase.com/dashboard**

**Step 2.** Log in if needed. Click the **manu2print** project (or the project that backs manu2print).

**Step 3.** In the left sidebar, click **SQL Editor**.

**Step 4.** Click **+ New query** (or the equivalent so you have an empty query box).

**Step 5.** Paste this exactly into the query box:

```
-- Add first_name for email marketing and personalization
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name text;

COMMENT ON COLUMN profiles.first_name IS 'User-provided first name for emails and dashboard.';
```

**Step 6.** Click **Run** (or press the keyboard shortcut shown, e.g. Cmd/Ctrl + Enter).

**Step 7.** Confirm: you should see a success message (e.g. “Success. No rows returned”). If you see an error, check that you’re in the correct project and that the `profiles` table exists (migrations 001–006 were run previously).

**Step 8.** Done. The `profiles` table now has a `first_name` column. Users can save their first name on the profile page. No further policy change is needed; RLS already allows users to update their own row.

### Support inbox (when you’re ready)

- **Step 1:** Create an address (e.g. support@manu2print.com) or use an ESP that gives you one (Resend, SendGrid, etc.).
- **Step 2:** In §6.5 LEGAL_OR_THREAT template (and any “Contact support” copy), use that address. Right now the doc says “e.g. support@manu2print.com”.
- **Step 3 (optional):** Wire inbound email to a webhook so you can add AI reply later; see §6.2.

No code change required until you want inbound + AI. The template already says “Direct the user to official support.”

---

## Later (when you’re ready)

- **AI writer:** §6 has the full plan (persona, behavior layer, product facts, ESP + AI). Build when you want automated support or marketing emails.
- **When adding tools/features:** Update `docs/PRODUCT-FACTS.md` and `ai-knowledgebase/features.md` (and workflows if needed) so AI knowledge stays accurate.
