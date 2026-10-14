# Blog Topic Backlog

Candidate topics from weekly Reddit/KDP-forum research (DYOR), queued for the twice-weekly blog publishing task. Entries are removed once published — see src/lib/blog.ts for what's already live.

## Queued

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

- **Title:** KDP Now Gives You Two New Titles a Week. A Botched Draft Can Burn One.
  **Angle:** Since September 21, 2026, KDP caps new title creation at 2 per format per week (down from 10, exception route removed), and Amazon still hasn't clearly said whether creating a draft spends a slot or whether deleting one gives it back. Series, box-set and translation authors are being told to stagger releases over weeks, so starting a title before the files are actually clean is now a scheduling cost, not just an annoyance.
  **Tool link:** /kdp-pdf-checker
  **Tags:** kdp, workflow, publishing
  **Source:** KDP Community "Title Creation Limits Update" announcement plus author reaction across KDP Community, SFF Chronicles, and self-publishing Substacks/blogs debating draft-slot counting and per-format vs. total; researched 2026-10-08

- **Title:** You Have 72 Hours to Fix Your Paperback's Title. Then It's Locked Forever.
  **Angle:** KDP print books allow title, subtitle and primary-author edits only within 72 hours of first going live (and only once out of review). After that the fields lock and the official route is a new edition with a new ASIN. Older forum answers saying "you can never change a paperback title" pre-date the window, so authors either panic for no reason or miss the window without knowing it existed.
  **Tool link:** none
  **Tags:** kdp, publishing, troubleshooting
  **Source:** KDP Help "Update your book details" page cross-checked against recurring KDP Community "how do I change my title" threads with outdated answers; researched 2026-10-08

- **Title:** Your Interior Images Looked Perfect on Screen and Printed Like Mud
  **Angle:** Recurring "proof came back too dark/blurry" posts (coloring books, picture books, Canva-built interiors) come down to a few causes: backlit screens vs. reflective paper, grayscale images with crushed shadows, images under ~150 DPI at final size, and "Standard"/compressed PDF exports instead of print-quality ones. Each re-proof costs shipping, so authors burn money guessing at a brightness slider.
  **Tool link:** /kdp-pdf-checker
  **Tags:** kdp, pdf, formatting
  **Source:** Long-running KDP Community, Goodreads Indie-author and Adobe Community threads on dark/blurry proofs; 2026 guides still answering the same question; researched 2026-10-08

- **Title:** KDP's New Pre-Order Rules: 18 Months Out, Two Free Postponements, and a Third That Can Kill the Listing
  **Angle:** Kindle pre-orders created on or after September 2, 2026 can sit up to 18 months out (the old limit was 12), but you only get two penalty-free postponements, each within 6 months of the original date, and a third can auto-cancel the listing. Combined with the new two-titles-a-week cap, more authors will be leaning on long pre-orders to stagger series, which makes the postponement trap easier to step into.
  **Tool link:** none
  **Tags:** kdp, pre-order, workflow
  **Source:** Reporting on KDP's September 2026 pre-order changes alongside author discussion of using pre-orders to work around the new weekly title cap; researched 2026-10-08

- **Title:** Your Proof Copy Looked Perfect. KDP Rejected the Book Anyway.
  **Angle:** Authors order a proof, approve it, hit Publish, and only then get a formatting or "mismatch" notice, because KDP runs one more check after the proof stage. The usual culprit isn't the layout at all: the book details say "John T. Smith" while the title page says "J.T. Smith", or the subtitle on the cover doesn't match the listing. A proof that looks right in your hands proves nothing about that final metadata check.
  **Tool link:** /kdp-pdf-checker
  **Tags:** kdp, rejection, proof
  **Source:** Recurring KDP Community threads ("I ordered a proof and it looked fine, then was told to alter…") plus KDP's "Fix Paperback and Hardcover Formatting Issues" help page on book-detail/title-page mismatches; researched 2026-10-14

- **Title:** Kindle Previewer 3 Is Dead. Here's What Kindle Previewer 4 Does (and Still Doesn't) Tell You.
  **Angle:** KDP released Kindle Previewer 4 in late September 2026 and now says version 3 and earlier are unsupported, so authors are reinstalling and wondering whether their old "it looked fine in Previewer" checks still hold. The new version adds Apple-silicon support, dark mode and command-line batch validation, but it's still a simulation, not a device. Distinct from the existing "Looks Perfect in Kindle Previewer, Scrambled on a Real Kindle" post: this one is about the version switch and what to re-check.
  **Tool link:** none
  **Tags:** kdp, ebook, kindle-previewer
  **Source:** KDP Community announcement "Kindle Previewer 4 now available for download" (Sept 2026) and KDP Help page stating older versions are unsupported, plus author setup write-ups; researched 2026-10-14

- **Title:** Fourteen Years on KDP, Terminated Over "Previously Published." Here's the Paper Trail to Keep Now.
  **Angle:** Several long-time authors in 2026 lost whole KDP accounts after automated checks flagged their own books as previously published or too similar to existing titles, and terminated accounts lose listings and unpaid royalties. The practical lesson is to keep dated proof of ownership (source files, first-publication records, ISBN and copyright records) and avoid re-uploading near-identical editions with big metadata changes. Distinct from the existing catalog-suspension keyword post: different trigger, different defence.
  **Tool link:** none
  **Tags:** kdp, account, content-policy
  **Source:** Self-Publishing with Dale newsletter (Oct 1, 2026) on Ruthanne Reid's termination, a Feb 2026 author blog on an unexplained termination, and the Roland Hulme similar-content case; researched 2026-10-14

- **Title:** "$2 a Paperback Sale" Is a Real Strategy. Here's the Math Behind It on KDP vs IngramSpark.
  **Angle:** Authors keep asking how to price paperbacks when print cost eats most of the list price, and the r/selfpublish answers range from "about $2 a sale so the price stays sane" to "aim for $3-4". The same book can earn very different amounts on KDP and IngramSpark because of different print costs and wholesale discounts, so a price that works on one can lose money on the other.
  **Tool link:** /royalty-calculator
  **Tags:** kdp, pricing, royalty
  **Source:** r/selfpublish paperback-pricing thread pattern (Sept 2026) and ebookpbook.com's Oct 13, 2026 KDP vs IngramSpark paperback pricing breakdown; researched 2026-10-14
