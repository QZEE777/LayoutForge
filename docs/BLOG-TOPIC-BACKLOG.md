# Blog Topic Backlog

Candidate topics from weekly Reddit/KDP-forum research (DYOR), queued for the twice-weekly blog publishing task. Entries are removed once published — see src/lib/blog.ts for what's already live.

## Queued

- **Title:** KDP's Rank Used to Update Hourly. Now It Takes Up to Six Days — Most Authors Are Still Optimizing for the Old Speed
  **Angle:** Under the newer ranking system, sales-rank changes can take days rather than hours to show on the book page, which quietly breaks a lot of common author tactics (rank-chasing during a promo, judging a launch's success in the first 24 hours) that assumed near-real-time feedback.
  **Tool link:** none
  **Tags:** kdp, algorithm, discoverability
  **Source:** Pattern across 2026 KDP algorithm-change analyses describing slower rank-update cadence; researched 2026-09-02

- **Title:** KDP Just Raised the 70% Royalty Ceiling to $12.99 — Should You Reprice?
  **Angle:** For 19 years the 70% ebook royalty band topped out at $9.99; as of July 7, 2026 it now runs to $12.99, meaning box sets and higher-value nonfiction that used to fall into the 35% tier at $10-12.99 now qualify for double the royalty — but repricing is opt-in, so books already above $9.99 stay stuck at 35% until an author manually switches the setting.
  **Tool link:** /royalty-calculator
  **Tags:** kdp, royalty, pricing
  **Source:** Multiple self-publishing news outlets (Author Media, selfpub.substack.com, Good e-Reader) reporting the July 7, 2026 KDP royalty band expansion; researched 2026-09-09

- **Title:** "AI-Assisted" and "AI-Generated" Aren't the Same Checkbox — And Editing Doesn't Move You Between Them
  **Angle:** Authors widely believe heavy editing of AI-drafted text "erases" the need to disclose it, but KDP's actual rule cares about who wrote the first version, not who polished the last one — so a heavily-rewritten AI draft is still AI-generated, while AI used only for brainstorming/outlining/grammar checks is AI-assisted and needs no disclosure at all; translations via DeepL/ChatGPT are a separate disclosure category authors routinely forget.
  **Tool link:** none
  **Tags:** kdp, ai-disclosure, content-policy
  **Source:** Pattern across 2026 KDP AI-policy guides (Authors Guild coverage, multiple compliance-guide sites) documenting the recurring "editing erases it" misconception; researched 2026-09-09

- **Title:** Kindle Create Keeps Corrupting Your File. Here's Why Authors Still Use It Anyway.
  **Angle:** Amazon's own free formatting tool has a long-running reputation in author communities for randomly failing to reopen previously-saved files, lacking basic spell-check or track-changes, and shipping frequent version changes that break workflows mid-project — yet it's still the first tool Amazon points new authors to.
  **Tool link:** none
  **Tags:** kdp, formatting, tools
  **Source:** Recurring complaints across KDP Community forum threads and author blogs about Kindle Create reliability and missing editing features; researched 2026-09-09

- **Title:** "Insufficient Gutter" — KDP's Cover Error Is Talking About a Page You Never Touched
  **Angle:** One of the most common KDP cover-upload rejections uses the word "gutter," and authors instinctively go fix their interior file's inside margin — but on a cover error, "gutter" almost always means the cover's own spine-width math, not the interior gutter margin at all, and the two get confused constantly because Word treats them as unrelated settings.
  **Tool link:** /spine-width-calculator
  **Tags:** kdp, cover, spine
  **Source:** Recurring pattern in Adobe Community and Kboards threads showing authors fixing interior margins in response to cover-gutter rejection errors; researched 2026-09-09

- **Title:** Your Hardcover Math Isn't Paperback Math (And a Guessed Spine Will Crack)
  **Angle:** Hardcover covers add a 0.625" wrap around the boards plus 0.375" hinge channels on each side of the spine — dimensions paperback covers don't have at all — and hardcovers cap at 550 pages for a physical reason (binding needs minimum thickness to support rigid boards), so authors applying paperback cover math to a hardcover file get rejections or, worse, a proof that splits open at the spine.
  **Tool link:** /spine-width-calculator
  **Tags:** kdp, hardcover, cover
  **Source:** KDP's own hardcover spec pages plus KDP Community forum thread ("Max number of pages") describing physical spine-splitting risk near the page ceiling; researched 2026-09-09

- **Title:** One Photoshop Checkbox Is Why Your Cover PDF Won't Upload
  **Angle:** Authors export a cover PDF from Photoshop or Illustrator with "Preserve Photoshop Editing Capabilities" (or the Illustrator equivalent) left checked, and the file balloons to a size KDP's cover uploader rejects or hangs on indefinitely — the fix is a single checkbox at export, not a redesign, but nothing in KDP's error messaging points to it, so authors spend hours guessing at dimensions and DPI instead.
  **Tool link:** /pdf-compress
  **Tags:** kdp, cover, file-size
  **Source:** Recurring pattern across Adobe Community and KDP Community "cover won't upload" threads tracing oversized cover PDFs to this specific export setting; researched 2026-09-16

- **Title:** Your KENP Reads Just Flatlined. It's Not a Glitch — It's "Buy" vs. "Read for Free."
  **Angle:** Authors running a free promo see downloads climb while their Kindle Unlimited page-read counter sits at zero, assume it's a reporting bug, and file a support ticket — but Amazon only pays KENP on a "Read for Free" click; if a reader clicks "Buy" on a $0 book during a promo, it posts as a sale with no page reads attached, and the dashboard doesn't distinguish the two anywhere an author would think to look.
  **Tool link:** /royalty-calculator
  **Tags:** kdp, royalty, kindle-unlimited
  **Source:** Recurring "downloads with no reads" pattern across KDP Community threads, resolved in-thread as a Buy-vs-Borrow distinction rather than a platform bug; researched 2026-09-16

- **Title:** Draft2Digital Just Raised Print Costs Again — Does "Going Wide" Still Pencil Out?
  **Angle:** Draft2Digital's print-on-demand costs increased for all account holders starting February 1, 2026, following its print partner's pricing update — for authors weighing KDP-exclusive against wide print distribution, the math authors did a year ago is now stale, and nobody re-runs it until a royalty statement looks wrong.
  **Tool link:** /royalty-calculator
  **Tags:** kdp, pricing, wide-publishing
  **Source:** selfpub.substack.com reporting on D2D's Feb 1, 2026 print cost increase; researched 2026-09-16

- **Title:** KDP Can Unpublish a Book That's Already Live — Over Reader-Reported Formatting Complaints
  **Angle:** It's not just upload-time rejections authors need to worry about: a live, already-approved book can be pulled later via a "quality assurance review" triggered by reader complaints about formatting, with the listing going to a 404 with little warning — a reminder that a clean upload isn't a permanent guarantee if a formatting issue was missed at launch and readers start flagging it.
  **Tool link:** /kdp-pdf-checker
  **Tags:** kdp, rejection, content-policy
  **Source:** Author blog account of a post-launch KDP "quality assurance review" unpublishing following reader formatting complaints; pattern consistent with known KDP review escalation described in this site's own catalog-suspension post; researched 2026-09-16
