# Free tools — cost and what to watch

## Which free tools cost you money?

| Tool | Free to user? | What we pay for |
|------|----------------|------------------|
| **PDF Print Optimizer** (kdp-formatter-pdf) | Yes | **Nothing.** Runs 100% in the user’s browser (pdfjs-dist + pdf-lib). No file upload, no CloudConvert. |
| **PDF Compressor** (pdf-compress) | Yes (email required) | **Supabase only** — 1 row in `email_captures` per use (negligible). Compression runs in the browser; we only capture email via POST /api/pdf-compress/lead. No CloudConvert. |

Paid tools (KDP Checker, Keyword Research, Description Generator, etc.) still use CloudConvert when they do PDF conversion; those runs are gated by payment.

---

## Why this helps

- **Cost:** Free tools no longer consume CloudConvert. Uptake on Compressor and Print Optimizer does not increase conversion spend.
- **Security & privacy:** User files never leave their device for these two tools. Good for trust and compliance.
- **Reasonable pricing:** Keeping free tools truly free (no hidden API cost) supports your positioning: solutions at reasonable prices, with paid tools carrying the cost.

---

## What’s in place today

- **PDF Print Optimizer:** Client-side only. User selects file → we run optimize in browser (Mozilla pdfjs-dist + pdf-lib) → user downloads from a blob. No server call for the file.
- **PDF Compressor:** Client-side only. User enters email → we call POST /api/pdf-compress/lead (email only) → compression runs in browser → user downloads from a blob. No CloudConvert, no file storage.
- **Cleanup done:** Old CloudConvert routes for the free tools have been removed (`/api/kdp-formatter-pdf`, `/api/pdf-compress`, `/api/pdf-compress/status`). Only `/api/pdf-compress/lead` (email capture) remains for the Compressor.

---

## What to watch (paid tools and overall)

- **CloudConvert:** Monitor usage for **paid** flows (keyword research PDF, description generator PDF, etc.). Set a budget or alert if you’re on a paid plan.
- **Vercel:** Serverless invocations and bandwidth for paid tools and API routes.
- **Supabase:** Storage and `email_captures` (and any other tables). Still minimal for free tools.

---

## Short answer

- **Free PDF tools:** No CloudConvert, no file upload. Cost is effectively zero (Supabase email row for Compressor only).
- **Paid tools:** CloudConvert and other services still apply; keep an eye on usage as uptake grows. Stay cognizant of cost and security for both you and the user; your biggest draw is solutions at reasonable pricing.
