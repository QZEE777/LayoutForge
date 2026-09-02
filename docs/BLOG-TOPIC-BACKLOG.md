# Blog Topic Backlog

Candidate topics from weekly Reddit/KDP-forum research (DYOR), queued for the twice-weekly blog publishing task. Entries are removed once published — see src/lib/blog.ts for what's already live.

## Queued

- **Title:** Your Book Looks Perfect in Kindle Previewer. On a Real Kindle, It's Scrambled.
  **Angle:** Kindle doesn't actually render EPUB directly — it silently converts on the fly, and KDP's own online Previewer doesn't reliably reflect what a real device shows, so authors ship ebooks that pass every check they know to run and still break on delivery.
  **Tool link:** none (no live route yet — docs/EPUB-MAKER-IMPLEMENTATION-PLAN.md describes a planned CloudConvert DOCX→EPUB pipeline at /epub-maker, not yet built; good piece to have ready for when it ships)
  **Tags:** kdp, ebook, epub
  **Source:** Recurring pattern across Adobe Community/Goodreads author-forum threads (Reddit itself not indexed for this query) — "looks immaculate in Kindle Previewer, scrambled on device" is a named, repeated complaint; researched 2026-09-02

- **Title:** Vellum Is Mac-Only. Here's What Windows Authors Actually Do About It.
  **Angle:** The most-recommended KDP formatting tool in every forum thread simply doesn't run on Windows — authors are quietly paying for MacInCloud subscriptions or switching to Atticus, and nobody frames it as the accessibility problem it is.
  **Tool link:** /kdp-pdf-checker (or none — this is a platform-choice piece, not a checker pitch)
  **Tags:** kdp, formatting, vellum
  **Source:** Recurring theme across self-publishing tool-comparison threads and blog commentary — Vellum's Mac exclusivity vs. Atticus as the cross-platform alternative; researched 2026-09-02

- **Title:** KDP Cut Your Categories From 10 to 3 — And You Can't Email for More Anymore
  **Angle:** Authors used to stack up to 10 browse categories and could email KDP support to add niche ones after the fact; both paths are gone, and most pricing/positioning advice floating around forums still assumes the old system.
  **Tool link:** none
  **Tags:** kdp, categories, discoverability
  **Source:** Pattern across 2026 KDP-strategy blogs and community threads describing the category cap drop and removal of manual category-request emails; researched 2026-09-02

- **Title:** Your DOCX "Export to PDF" Broke Your Tables and Nobody Told You Why
  **Angle:** Authors export a clean Word manuscript to PDF, upload to KDP, and find tables no longer "stay" and photos go "wonky" — the cause is almost always transparency/flattening in the export pipeline, not the manuscript itself, but Word's export dialog gives zero indication of this.
  **Tool link:** none (no live route yet — CLAUDE.md lists "DOCX Manuscript Formatter" as coming soon; not built)
  **Tags:** kdp, docx, formatting
  **Source:** Recurring pattern in Adobe Community and author-blog threads describing DOCX→PDF table/image corruption on KDP upload; researched 2026-09-02

- **Title:** KDP's Rank Used to Update Hourly. Now It Takes Up to Six Days — Most Authors Are Still Optimizing for the Old Speed
  **Angle:** Under the newer ranking system, sales-rank changes can take days rather than hours to show on the book page, which quietly breaks a lot of common author tactics (rank-chasing during a promo, judging a launch's success in the first 24 hours) that assumed near-real-time feedback.
  **Tool link:** none
  **Tags:** kdp, algorithm, discoverability
  **Source:** Pattern across 2026 KDP algorithm-change analyses describing slower rank-update cadence; researched 2026-09-02
