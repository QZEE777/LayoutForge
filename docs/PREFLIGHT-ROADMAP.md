# Preflight Roadmap & Go-Live Strategy

**MVP:** The PDF checker (current "KDP Preflight") is the product. It must be front and center, very visual, and rock-solid for beta.

---

## Go-Live Strategy (Beta in 1–2 Days)

### Fix errors first, then additive

**Recommendation: fix discrepancies first, then add value.**

- Additive work (new features, redesign, copy changes) can introduce regressions. If we add first and fix after, we risk fixing the same things again.
- For beta, **stability of the critical path** matters most: upload → preflight (or site API) → report → payment → download → viewer.
- Order of work:
  1. **Phase 0 (below):** Fix all items that could cause Render/Vercel errors or broken UX. One at a time.
  2. **Then:** Name change + put the checker front and center + "Coming soon" for selected tools.
  3. **Then (post-beta):** Full site redesign (layout, colors). Doing a full redesign in 1–2 days is high risk; better to ship beta with a clear hero and one accent shift, then redesign in a dedicated sprint.

### Beta scope (realistic for 1–2 days)

| In scope for beta | Out of scope for beta |
|-------------------|------------------------|
| PDF checker (MVP) working end-to-end | Full site redesign |
| 2–4 supporting tools verified (e.g. PDF Compressor, Formatter, 1–2 calculators) | Every tool tested "insanely well" |
| New name + hero placement for checker | New branding system |
| "Coming soon" for non-MVP tools | All tools live |
| Minimal layout tweak so checker is obviously #1 | Full layout/color overhaul |

### Name: not "KDP Preflight"

You want this tool front and center and very visual—and the name should match.

**Options to consider:**

- **Print Ready Check** — Clear, action-oriented.
- **PDF Check** — Short, obvious.
- **Format Check** — Aligns with "formatting" stack.
- **Manu2Print Check** — Branded; "Check" keeps it simple.

Once you pick one, we rename everywhere: `platformTools`, homepage BENEFITS, checker page title/breadcrumb, all cross-links (formatter, PDF compressor, download page, KdpUploadWarning, etc.). The engine can stay "KDP Preflight Engine" internally if you like; the **product name** on the site is what we change.

### Front and center

- **Homepage:** One primary CTA: "Check your PDF" (or chosen name) → links to the checker. Secondary: Get Started / See all tools.
- **Hero:** Lead with the checker: e.g. "Check your print PDF before you upload. 26 KDP rules. Pass/fail in minutes." Then supporting benefits below.
- **Visual:** Big, obvious upload area on the checker page; after report, prominent "View issues on your PDF" when applicable. No burying the main action.

### "Coming soon" tools

So we don’t promise tools we haven’t verified for beta:

- **Already unavailable:** `market-analysis` (`available: false`) — keep as is.
- **Suggest marking "Coming soon" for beta** (so only MVP + a few are "live"):
  - `kdp-format-review` — AI review (separate flow; can go live after beta if stable).
  - `epub-maker` — Different pipeline; verify after beta.
  - `keyword-research-pdf` / `description-generator-pdf` — If not verified, mark coming soon.
  - Optional: `keyword-research`, `description-generator` (DOCX) — same as above.

**Recommended beta-live tools:** PDF checker (MVP), PDF Compressor, KDP Formatter (DOCX), Royalty Calculator, Banned Keyword Checker, Spine/cover calculators. Everything else can be "Coming soon" until we’ve tested them.

---

## Phased Roadmap

### Phase 0 — Must-have for beta (fix first, one at a time)

Do these in order. After each, confirm the app still works before the next.

| # | Item | Why |
|---|------|-----|
| 0.1 | **Health check includes Redis** ✅ | Done: `GET /health/ready` returns 503 if Redis is unreachable. Use as Render health path when possible. |
| 0.2 | **Preflight engine: Celery + Upstash SSL** | Already added in code; confirm Render deploy uses it and worker connects. |
| 0.3 | **Vercel env** | Confirm `KDP_PREFLIGHT_API_URL` and `NEXT_PUBLIC_KDP_PREFLIGHT_API_URL` are set and point to Render (no trailing slash). |
| 0.4 | **Critical path test** | One full run: upload small PDF (< 4 MB) via site → report → pay (or free path) → download → "View issues on PDF" works. Then one run with larger PDF (direct upload) if preflight URL set. |
| 0.5 | **Error messaging** | "Failed to fetch" and 413 show clear copy (already improved); confirm and fix any remaining vague errors. |
| 0.6 | **Mark "Coming soon"** | In `platformTools.ts`, set `available: false` (and optionally add a `comingSoon: true` or copy "Coming soon" in UI) for tools not in beta scope. |

### Phase 1 — Right after beta (sustainability)

| # | Item |
|---|------|
| 1.1 | S3/R2 for uploads (no dependency on Render local disk). |
| 1.2 | Split API and Celery worker on Render (optional but recommended as traffic grows). |
| 1.3 | Automated tests: at least one rule-engine test (known PDF → expected PASS/FAIL) and one upload → status → report integration test. |
| 1.4 | Observability: structured logs or simple metrics for job lifecycle (job_id, status, duration). |

### Phase 2 — Differentiation (superior product)

| # | Item |
|---|------|
| 2.1 | "How to fix" per rule (short text + optional KDP doc link). |
| 2.2 | Closest-trim suggestion when trim is invalid. |
| 2.3 | Report export (PDF or JSON download from download page). |
| 2.4 | Optional: API tier for studios/formatters (key-based POST → report). |
| 2.5 | Optional: Cover preflight (dimensions, spine, bleed) as separate flow. |

### Phase 3 — Full redesign (post-beta)

| # | Item |
|---|------|
| 3.1 | New layout: navigation, sections, hierarchy. |
| 3.2 | New color system and typography. |
| 3.3 | Consistent components and spacing across all tools. |
| 3.4 | Accessibility and mobile pass. |

---

## Summary: What to do next

1. **Pick a new name** for the PDF checker (e.g. Print Ready Check, PDF Check, Format Check, or Manu2Print Check).
2. **Work Phase 0 in order** (0.1 → 0.6), one item at a time. I can implement 0.1 (health + Redis) next.
3. **After Phase 0:** Rename the product everywhere, put the checker in the hero, and set "Coming soon" for the chosen tools.
4. **Leave full redesign for Phase 3** so beta ships in 1–2 days without blocking on design.

If you tell me the chosen name and confirm "coming soon" list, I’ll start with Phase 0.1 (health check including Redis) and then we can go through 0.2–0.6 one by one.
