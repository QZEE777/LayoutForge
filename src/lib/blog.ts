export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string; // ISO date string
  /** When false, cron may email platform_notifications subscribers once. */
  notified?: boolean;
  tags?: string[];
  contentType?: "article" | "video" | "hybrid";
  videoUrl?: string;
  videoCaption?: string;
  content: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "ul"; items: string[] }
  >;
};

const POSTS: BlogPost[] = [
  {
    slug: "1000-dollar-formatter-what-youre-actually-paying-for",
    title: "$1,000 to Format a Book? Here's What You're Actually Paying For",
    excerpt:
      "One Reddit thread asking 'how do you guys afford this' pulled 200 comments in a week. Here's what a $1,000 formatting quote actually covers — and which parts of it you can do yourself for free.",
    publishedAt: "2026-08-03",
    tags: ["kdp", "formatting", "cost"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "A post titled \"How do you guys afford this?\" pulled over 200 comments in r/selfpublish in a matter of days. The author's math: editor, cover, formatting — easily $2,000 before a single copy sells, with no guarantee anyone buys it. The replies were a mix of sympathy, budget tricks, and quiet panic from people in the exact same spot.",
      },
      {
        type: "p",
        text: "Formatting is usually the smallest of those three costs and the easiest to cut without hurting your book. Here's what you're actually paying a formatter for, broken into pieces — so you can decide which ones you genuinely need to outsource.",
      },
      {
        type: "h2",
        text: "What a $1,000 formatting quote covers",
      },
      {
        type: "ul",
        items: [
          "Page setup — trim size, margins, gutter, bleed configured correctly for your chosen size",
          "Typesetting — chapter starts, drop caps, running heads, consistent styling throughout",
          "Front/back matter — title page, copyright page, dedication, about-the-author layout",
          "Export — generating a print-ready PDF and a separate EPUB/MOBI for ebook",
          "Fixes — correcting whatever KDP's checker flags on the first upload attempt",
        ],
      },
      {
        type: "p",
        text: "Of those five, the first and last — page setup and fixing checker rejections — are pure geometry. There's no craft in a 0.75-inch margin or a 0.125-inch bleed. It's numbers matching numbers. That's the part costing you the most anxiety and the least actual skill.",
      },
      {
        type: "h2",
        text: "What's genuinely worth paying for",
      },
      {
        type: "p",
        text: "Typesetting judgment — deciding how a chapter opener should look, choosing type that suits your genre, making 400 pages feel considered rather than default — that's real craft, and it's the part that separates a book that reads as \"self-published\" from one that doesn't. If you're going to spend money, that's where it buys something you can't easily replicate with a template.",
      },
      {
        type: "p",
        text: "Front and back matter is also worth having a second pair of eyes on, mostly because it's boring to do yourself and easy to get subtly wrong — copyright pages have conventions readers half-notice even when they can't name them.",
      },
      {
        type: "h2",
        text: "What you can do yourself for free",
      },
      {
        type: "p",
        text: "Page setup: Word, Google Docs, and free tools like Reedsy's formatter can all produce a compliant print PDF once the trim size, margins, and bleed are set correctly — the settings are public, not proprietary. The problem was never that you couldn't do it. It's that nobody tells you exactly what \"correctly\" means until KDP rejects the file and you're guessing at which measurement was off.",
      },
      {
        type: "p",
        text: "That's the gap a $9 scan closes cheaper than a $1,000 formatter: run your self-formatted PDF through manu2print's checker before you upload, and you get a page-by-page report of exactly what's wrong — margins, bleed, fonts, trim size — instead of a vague KDP rejection email and a guess.",
      },
      {
        type: "h2",
        text: "The real fix for \"how do you afford this\"",
      },
      {
        type: "p",
        text: "You don't have to afford all of it. Format it yourself using free tools, spend the money you saved on an editor (which genuinely can't be replaced by software), and use a $9 scan to catch the mistakes before Amazon does instead of paying someone $1,000 to catch them for you.",
      },
    ],
  },
  {
    slug: "cover-designer-vanished-page-count-changed",
    title: "Your Cover Designer Vanished and Your Page Count Changed — Now What",
    excerpt:
      "You sent your designer a 400-page cover template. Your manuscript is now 450 pages. They've gone quiet. Here's what actually happens when you upload a mismatched cover — and how to fix it yourself.",
    publishedAt: "2026-07-31",
    tags: ["kdp", "cover", "spine"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "A thread in r/selfpublish laid out a familiar nightmare: a cover designer was sent a KDP template built for a 400-page manuscript. Months later, after a final editing pass, the book sits at 450 pages. The designer has gone dark — no replies, commissions closed, no activity. The author's question: what actually happens when a mismatched cover meets a manuscript at upload?",
      },
      {
        type: "h2",
        text: "What KDP does — and doesn't do — with a mismatched cover",
      },
      {
        type: "p",
        text: "KDP does not resize your cover for you. Page count drives spine width, and spine width is baked into the cover file itself — it's not a setting you adjust after the fact. A cover built for 400 pages has a spine sized for 400 pages. Uploading it against a 450-page manuscript will fail at the upload checker, because the spine will be too narrow for the actual print thickness.",
      },
      {
        type: "p",
        text: "The failure mode you'll usually see is a flat rejection citing cover dimensions, sometimes phrased as the wrong total width for your trim size and page count. It's not a mysterious error — it's the same spine-width math that determines every KDP cover, just now out of sync with your file.",
      },
      {
        type: "h2",
        text: "The fix doesn't require your original designer",
      },
      {
        type: "p",
        text: "Spine width is a formula, not an art decision: page count, paper type (white or cream), and trim size go in, spine width comes out. You don't need the original designer to recalculate it — you need the front and back cover artwork they already delivered, and the correct spine measurement for your new page count.",
      },
      {
        type: "ul",
        items: [
          "Get your exact spine width for the new page count from a spine calculator — free, instant, no design skill needed",
          "Re-lay the existing front cover, spine text, and back cover onto a template sized for the new total width",
          "If the artwork is layered (PSD, AI, or Canva with editable layers), this is a resize, not a redesign",
          "If you only have a flattened image, a designer can still do this cheaply — it's a template swap, not new art",
        ],
      },
      {
        type: "h2",
        text: "Prevent this on your next book",
      },
      {
        type: "p",
        text: "Lock your manuscript's page count before commissioning a cover, not after. If edits are still likely, tell your designer up front and get the spine built to a slightly generous estimate — a little empty margin is invisible; a spine that's too narrow isn't. And before you upload anything, run your numbers through manu2print's free cover size calculator so you're handing over an exact spec instead of a guess.",
      },
    ],
  },
  {
    slug: "kdp-ai-checkbox-wont-accept-no",
    title: "The KDP AI Checkbox Bug Nobody Warned You About",
    excerpt:
      "An author with a 100% human-written book couldn't get KDP's AI-content checkbox to accept \"No.\" It's not a policy problem — it's a form bug authors keep hitting with no warning. Here's what's actually going on.",
    publishedAt: "2026-07-29",
    tags: ["kdp", "ai-disclosure", "troubleshooting"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "\"I'm trying to post my latest book, which contains no AI involvement at all, but it won't let me select 'No.' It keeps saying 'confirm your answer is correct.'\" That's a real KDP author, describing a real upload session, on a book they wrote entirely themselves. The thread got dozens of replies from other authors hitting the exact same wall.",
      },
      {
        type: "h2",
        text: "This is a form bug, not a policy decision",
      },
      {
        type: "p",
        text: "Amazon added AI-content disclosure questions to the publishing flow to comply with its own AI content policy — authors now confirm whether text or images were AI-generated or AI-assisted. The intent is reasonable. The implementation, based on repeated author reports, has an intermittent glitch where the \"No\" selection doesn't register as final, and the form keeps re-prompting as if no answer was given.",
      },
      {
        type: "p",
        text: "One author in the thread found a workaround: saving as a draft, refreshing the page, and a second checkbox appearing that finally let the answer stick. That's not a documented fix — it's an author discovering, by trial and error, that the form's state gets confused and a hard refresh resets it.",
      },
      {
        type: "h2",
        text: "What to do if it happens to you",
      },
      {
        type: "ul",
        items: [
          "Save your progress as a draft rather than fighting the checkbox in the same session",
          "Refresh the page fully (not just navigate back) before re-attempting the question",
          "Try a different browser or clear the tab's cache if the refresh alone doesn't work",
          "If it persists, contact KDP support directly and describe it as a form bug, not a policy question — you'll get routed to the right team faster",
        ],
      },
      {
        type: "h2",
        text: "Why this matters beyond the annoyance",
      },
      {
        type: "p",
        text: "AI disclosure is becoming a permanent part of KDP's publishing flow, not a one-time speed bump. If your book is genuinely 100% human-written, the honest answer is \"No\" — don't select \"Yes\" just to get past a stuck form, since that mischaracterizes your book and can affect how it's categorized or promoted. Push through the bug, don't answer around it.",
      },
    ],
  },
  {
    slug: "changed-one-word-amazon-blocked-my-book",
    title: "You Changed One Word and Amazon Blocked Your Book — Here's Why",
    excerpt:
      "A paperback sailed through review, got a proof approved, then got blocked after a single-word edit on resubmission. It's not random. Here's what actually triggers a re-review — and how to avoid it near your release date.",
    publishedAt: "2026-07-27",
    tags: ["kdp", "rejection", "troubleshooting"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "An author on r/selfpublish had their paperback approved, received a proof, and lowered the price with no issue. Then, with a release date days away, they reuploaded the manuscript with a single word changed. The book was blocked. No detailed explanation — just a block, on a file that had already passed review once.",
      },
      {
        type: "h2",
        text: "Why any change triggers a full re-review",
      },
      {
        type: "p",
        text: "KDP doesn't diff your new file against your old one and check only what changed. Every manuscript upload — even a resubmission with one word different — goes through the same automated pipeline as a brand-new file: page geometry, embedded fonts, image resolution, and content screening all run again from scratch.",
      },
      {
        type: "p",
        text: "That means a file that passed a week ago can fail today, not because the rules changed, but because your file was already sitting close to a limit, and reprocessing it (re-exporting, re-embedding fonts, sometimes even a different PDF export pass in the same software) shifted something by a fraction — enough to cross a threshold that wasn't crossed before.",
      },
      {
        type: "h2",
        text: "Content screening runs on every version, too",
      },
      {
        type: "p",
        text: "The content review — for text, imagery, rights issues — isn't a one-time check that gets waived on resubmission. It reruns. If your one-word edit was flagged for something unrelated to the edit itself (a phrase elsewhere in the manuscript, cover text, metadata), you'll see a block that appears to have nothing to do with what you actually changed, because in the system's eyes, you submitted an entirely new file.",
      },
      {
        type: "h2",
        text: "How to avoid this near your release date",
      },
      {
        type: "ul",
        items: [
          "Lock your final manuscript at least 5-7 days before release — treat every post-approval edit as a full resubmission risk",
          "If you must make a last-minute change, re-export the PDF fresh rather than editing the existing file in place",
          "Re-check margins, bleed, and font embedding after any re-export — the export process itself can shift measurements slightly",
          "If you get blocked with no clear reason, contact KDP support and ask specifically what triggered the block rather than guessing and re-uploading blind",
        ],
      },
      {
        type: "p",
        text: "The safest habit: run your file through a checker before every upload, not just the first one. A one-word edit takes 90 seconds to verify and can save you a release-day scramble.",
      },
    ],
  },
  {
    slug: "is-that-cover-explicit-kdp-toggle-explained",
    title: "Is That Cover \"Explicit\"? Amazon's Toggle, Explained",
    excerpt:
      "Lingerie, a swimsuit, a suggestive pose — where's the line? Authors keep asking the same question in KDP forums with no clear answer. Here's what the explicit-content toggle actually controls, and how to decide.",
    publishedAt: "2026-07-24",
    tags: ["kdp", "content-policy", "cover"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "\"Is an image of a woman in lingerie considered 'explicit'? Do I need to toggle the switch?\" That question, or a version of it, comes up constantly in KDP author communities — usually with no confident answer in the replies, because the line genuinely isn't obvious from KDP's own wording.",
      },
      {
        type: "h2",
        text: "What the toggle actually does",
      },
      {
        type: "p",
        text: "The explicit-content toggle doesn't block your book from being published — it changes how it's distributed and discovered. Toggling it on restricts the book from certain search results, recommendation placements, and some regional storefronts, and can trigger an age gate. It's a distribution setting, not a publish/reject gate.",
      },
      {
        type: "p",
        text: "That distinction matters for the decision: under-toggling risks a content-policy flag after the fact (worse, because it can trigger a review of your whole catalog); over-toggling just narrows your discoverability for a book that didn't need it restricted.",
      },
      {
        type: "h2",
        text: "A working rule of thumb",
      },
      {
        type: "ul",
        items: [
          "Suggestive but non-explicit (lingerie, swimwear, implied intimacy without nudity) — generally does not require the toggle, but check genre norms; romance and romantasy covers push this boundary constantly and mostly stay untoggled",
          "Nudity, even artistic or non-sexual — toggle it. This is the line KDP's own guidance is clearest about",
          "Sexual content described but not depicted on the cover, present inside the book — toggle applies to interior content too, not just cover art",
          "If you're asking the question, that's a signal — genuinely non-explicit covers rarely prompt authors to double-check",
        ],
      },
      {
        type: "h2",
        text: "When in doubt",
      },
      {
        type: "p",
        text: "Look at three or four bestsellers in your exact subgenre with similar cover content and see whether they're toggled — you can often tell from search visibility and whether the listing shows an age gate. It's not a perfect signal, but it's a better one than guessing from KDP's help text alone, which is deliberately broad and unhelpful for edge cases.",
      },
    ],
  },
  {
    slug: "formatter-ghosted-you-never-depend-on-one-again",
    title: "Why Your Formatter Ghosted You (And How to Never Depend on One Again)",
    excerpt:
      "Paid a contractor $1,000 for a \"simple\" 6x9 format. Months later: silence. It's a common enough story that it has its own thread every few weeks. Here's how to make sure it never costs you your launch date again.",
    publishedAt: "2026-07-22",
    tags: ["kdp", "formatting", "cost"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "\"Formatting by myself has not worked out for me. I tried a contractor who just disappeared. It also seems odd that contractors want $1,000 for a simple lit format and it takes months to get around to my project.\" That's from a thread titled simply \"I need a formatter!\" — and it's not a one-off. Versions of this story show up in KDP forums on a rolling basis.",
      },
      {
        type: "h2",
        text: "Why this keeps happening",
      },
      {
        type: "p",
        text: "Formatting-for-hire is largely an unregulated freelance market. There's no license, no standard turnaround, no escrow-by-default. A contractor taking a deposit and disappearing has almost no consequence beyond a bad review you may not even get to leave if the platform doesn't require project completion to post one. For a $1,000 job with a months-long queue, the incentive to keep every client happy is weaker than you'd assume.",
      },
      {
        type: "p",
        text: "This isn't a reason to never hire a formatter — plenty deliver reliably. It's a reason not to make your launch date depend entirely on one person you can't verify.",
      },
      {
        type: "h2",
        text: "The dependency you can remove",
      },
      {
        type: "p",
        text: "The actual risk isn't the money — it's that authors hand over their only formatting path to one contractor, with no fallback if that person vanishes. If formatting a compliant print PDF yourself is genuinely possible with free tools (it is — see the trim size, margin, and bleed settings are all public), then a formatter becomes a nice-to-have for polish, not a single point of failure for your release date.",
      },
      {
        type: "h2",
        text: "A safer way to hire, if you still want to",
      },
      {
        type: "ul",
        items: [
          "Never pay the full amount upfront — 50% deposit, 50% on delivery is standard and reasonable to request",
          "Ask for a small paid sample (one chapter) before committing to the full manuscript",
          "Check reviews specifically for delivery reliability, not just quality — the two are graded separately by past clients",
          "Set a hard deadline in writing before paying anything, with a stated consequence (refund clause) if missed",
        ],
      },
      {
        type: "h2",
        text: "Your fallback plan",
      },
      {
        type: "p",
        text: "Format a basic version yourself in parallel with any contractor work — even if it's rougher, it's a working file you own outright. Run it through manu2print's checker to confirm it's technically compliant. If your contractor delivers something better, use theirs. If they vanish, you still have a book ready to publish on your own timeline, not theirs.",
      },
    ],
  },
  {
    slug: "kdp-myths-that-refuse-to-die",
    title: "KDP Myths That Refuse to Die",
    excerpt:
      "Bleed is always required. Word can't make a valid print PDF. A human reads every book before it's rejected. None of that is true — here's what's actually going on behind each myth.",
    publishedAt: "2026-06-15",
    tags: ["kdp", "myths", "formatting"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Some KDP advice is wrong not because it was always wrong, but because it was once true for one specific situation and then got repeated as a universal rule. Here are the myths that show up most often in author forums — and what's actually true underneath each one.",
      },
      {
        type: "h2",
        text: "Myth: \"Every book needs bleed\"",
      },
      {
        type: "p",
        text: "Bleed exists for one reason: artwork that extends to the edge of the page. If your interior is plain text on a white background, with no images or color reaching the trim edge, you don't need bleed — and turning it on when you don't need it is a common cause of the \"add 0.125 to width, 0.25 to height\" rejection, because it changes the page size KDP expects.",
      },
      {
        type: "p",
        text: "Bleed is required when any image, color block, or design element touches or crosses the trim edge. A novel with chapter headings and body text almost never needs it. A children's book with full-page illustrations almost always does.",
      },
      {
        type: "h2",
        text: "Myth: \"Word can't produce a valid print PDF\"",
      },
      {
        type: "p",
        text: "Word gets blamed constantly, but it's rarely the tool's fault. Word can produce a fully compliant interior — correct trim size, margins, embedded fonts, 300 DPI images — when the page setup matches KDP's requirements before you export. The failures attributed to \"Word\" are almost always: page size left at A4 or Letter, margins not adjusted for the gutter, or fonts not embedded at export (Options → Save → Embed fonts in the file).",
      },
      {
        type: "p",
        text: "Vellum and InDesign handle some of this automatically, which is why they have a reputation for cleaner output. That's a difference in defaults, not a difference in what's possible.",
      },
      {
        type: "h2",
        text: "Myth: \"A person at Amazon reads your book before rejecting it\"",
      },
      {
        type: "p",
        text: "The interior and cover checks that produce most rejection emails are automated — they measure page dimensions, margins, bleed coverage, and font embedding against your selected trim size. That's why the rejection emails read like templates: they are templates, generated from which automated check failed.",
      },
      {
        type: "p",
        text: "Content review — the check for prohibited material, misleading titles, or rights issues — does involve human review at some stage, which is why those rejections take longer and the wording is more specific (if still often unhelpfully vague). But \"my margins are wrong\" rejections are pure measurement, and they're consistent: the same file will fail the same way every time, because nothing about the check changes between submissions.",
      },
      {
        type: "h2",
        text: "Myth: \"If the preview looks right, the file is right\"",
      },
      {
        type: "p",
        text: "The online previewer renders your file visually — it shows you what the page looks like. It does not always catch the measurement problems that the upload checker enforces. Authors regularly report a perfect-looking preview followed by a bleed or margin rejection on the same file, because the preview is a rendering tool and the checker is a geometry tool. They're answering different questions.",
      },
      {
        type: "h2",
        text: "Myth: \"KDP changed their requirements, that's why my file suddenly fails\"",
      },
      {
        type: "p",
        text: "This comes up whenever a previously-approved file gets rejected on resubmission. It's almost never a requirements change — it's that the original file was already on the edge of a requirement (margins exactly at the minimum, bleed barely covering the trim edge), and a tiny change shifted it just past the line. The check didn't change. The file's safety margin ran out.",
      },
      {
        type: "h2",
        text: "The Throughline",
      },
      {
        type: "p",
        text: "Every myth above comes from the same root cause: not knowing what your file's actual measurements are. Bleed, margins, trim size, and font embedding are all things you can check directly, before you upload, regardless of which tool made the file. manu2print.com/kdp-pdf-checker reads those measurements from your PDF and tells you, in plain terms, whether they match what KDP requires.",
      },
    ],
  },
  {
    slug: "book-too-big-by-0-002-inches",
    title: "Your Book Is 0.002 Inches Too Big. Amazon Doesn't Care That It's Close.",
    excerpt:
      "A PDF page that's 6.002\" instead of exactly 6.000\" looks identical to a human. To KDP's automated check, it's a fail. Here's why \"close enough\" doesn't exist in print specifications — and where that tiny gap actually comes from.",
    publishedAt: "2026-06-17",
    tags: ["kdp", "trim-size", "formatting"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Imagine two PDFs side by side. Both say \"6 x 9 inches.\" Both look, on screen, completely identical. One passes KDP's interior check. The other gets rejected for incorrect page size. The difference between them might be two-thousandths of an inch — less than the thickness of a sheet of paper. To you, that's nothing. To an automated check comparing exact page dimensions, it's a fail.",
      },
      {
        type: "h2",
        text: "Why Print Specs Don't Round",
      },
      {
        type: "p",
        text: "On screen, a fraction of a pixel doesn't matter — it gets rounded away invisibly. In a print file, the page size is a literal physical measurement that gets sent to a printing press. KDP's check isn't being pedantic for its own sake: it's verifying that the physical object it's about to manufacture will be exactly the trim size you selected, because the cover, the spine width, and the binding machinery are all calculated around that exact number.",
      },
      {
        type: "p",
        text: "A 0.002\" discrepancy on one page might be invisible. The same discrepancy compounding across binding tolerances, cover wrap, and trimming is how you get a book where the cover doesn't quite align with the pages — which is a far more visible problem than the number ever was.",
      },
      {
        type: "h2",
        text: "Where the Extra 0.002\" Actually Comes From",
      },
      {
        type: "p",
        text: "Nobody sets out to make a page 6.002 inches. It creeps in through unit conversion. Word, Canva, and most design tools store dimensions internally in points or pixels, then convert to inches for display. 6 inches is exactly 432 points — a clean number. But if a template was built in millimeters (152.4mm = 6 inches exactly, but software often stores 152mm or 153mm as the working value), the converted-back inch measurement comes out slightly off. Multiply that by the page count and the rounding error doesn't go away — it's baked into every page.",
      },
      {
        type: "p",
        text: "The other common source: a page was set up correctly, then resized slightly by a \"fit to page\" or \"scale to printable area\" option somewhere in the export chain — a setting that exists specifically to make things print nicely on home printers, and is actively harmful for files meant to be reproduced at exact size.",
      },
      {
        type: "h2",
        text: "Why You Can't See It",
      },
      {
        type: "p",
        text: "0.002 inches is roughly 0.05mm. No monitor renders at a resolution where that's visible, and most rulers don't have markings fine enough to catch it either. The only reliable way to know your page dimensions are exact is to read the PDF's actual page box values — the numbers embedded in the file itself, not what a ruler or a software dialog reports.",
      },
      {
        type: "h2",
        text: "The Fix Is Almost Always the Same",
      },
      {
        type: "p",
        text: "Don't try to nudge a near-correct page size closer with manual adjustments — that tends to introduce a different rounding error rather than removing the existing one. Instead, set the page size to the exact KDP trim dimensions in your source document's units (inches if your software defaults to inches, and double-check if it defaults to mm or points), and re-export. Then verify the output rather than assuming the export respected your input — exports are exactly where these tiny discrepancies are introduced.",
      },
      {
        type: "p",
        text: "manu2print.com/kdp-pdf-checker reads the literal page dimensions out of your PDF and compares them to your selected trim size — including discrepancies far too small to see, but not too small to get your file rejected.",
      },
    ],
  },
  {
    slug: "whats-inside-a-print-ready-pdf",
    title: "What's Actually Inside a Print-Ready PDF? (Open One Up With Me)",
    excerpt:
      "A PDF isn't just \"the pages.\" It's a container of page boxes, embedded fonts, color spaces, and image objects — and KDP's checker reads all of it. Here's a guided tour of what's actually in the file you're about to upload.",
    publishedAt: "2026-06-19",
    tags: ["kdp", "pdf", "formatting"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "When you export a PDF, you see one thing: pages that look like your book. But a PDF file is a structured container, and KDP's automated checks don't look at it the way you do — they read the underlying structure. Understanding what's actually in there makes every cryptic rejection message make a lot more sense.",
      },
      {
        type: "h2",
        text: "Page Boxes: There's More Than One \"Size\"",
      },
      {
        type: "p",
        text: "Every page in a PDF can define several different boxes: a MediaBox (the full physical page), a TrimBox (where the page gets cut to its final size), a BleedBox (the area including bleed), and a CropBox (what's shown by default). For a simple document these often overlap and nobody notices the difference. For a print file, they don't have to match — and KDP's check is comparing your TrimBox to your selected trim size, not the page size your software reports in its UI.",
      },
      {
        type: "p",
        text: "This is a common source of confusion: a design tool can report \"6 x 9 inches\" in its interface while the exported PDF's TrimBox says something slightly different, because the UI number and the embedded box value come from different parts of the export pipeline.",
      },
      {
        type: "h2",
        text: "Fonts: Embedded, Subset, or Missing",
      },
      {
        type: "p",
        text: "A PDF can reference a font in three ways. Fully embedded means the entire font file is packed inside the PDF — largest file size, most reliable. Subset embedding includes only the characters actually used in the document — common, efficient, and fine for KDP. Not embedded means the PDF just names the font and expects the viewing or printing system to supply it — which works on your screen because the font is installed there, and fails anywhere it isn't, including KDP's print pipeline.",
      },
      {
        type: "p",
        text: "Opening a PDF's font list (most PDF readers have a \"document properties\" or \"fonts\" panel) shows you exactly which of the three applies to each font in your file — directly answering the question \"are my fonts actually embedded\" instead of guessing.",
      },
      {
        type: "h2",
        text: "Color Space: RGB vs. CMYK",
      },
      {
        type: "p",
        text: "Screens display color by mixing red, green, and blue light (RGB). Printing presses lay down cyan, magenta, yellow, and black ink (CMYK). A PDF stores a color space per image and sometimes per element, and a file built for screens is typically RGB throughout. KDP accepts RGB interiors — it converts during printing — but covers are more sensitive, and colors that look vibrant in RGB can shift noticeably once converted to CMYK ink. This is why a cover that looked perfect on screen sometimes comes back from a printed proof looking duller or shifted toward a different hue.",
      },
      {
        type: "h2",
        text: "Images: Resolution Is Stored, Not Displayed",
      },
      {
        type: "p",
        text: "An image placed in a document at a small size on the page can still be a huge file internally — or the opposite. What matters for print is effective resolution: the pixel dimensions of the image divided by the physical size it's displayed at on the page. A 600x600 pixel image displayed at 2x2 inches is 300 DPI — sharp. The same image stretched to fill an 8x10 inch page is 75 DPI — visibly soft in print, even though it looked fine on a screen at the same stretched size.",
      },
      {
        type: "p",
        text: "This is stored per image inside the PDF and doesn't change based on how the page looks on your monitor — which is exactly why \"it looks fine on my screen\" and \"it'll print fine\" are unrelated claims.",
      },
      {
        type: "h2",
        text: "Why This Matters Before You Upload",
      },
      {
        type: "p",
        text: "Every KDP rejection about size, bleed, fonts, or image quality is the checker reading one of these structures and finding a mismatch. None of it is visible by looking at the rendered page — which is exactly why a file can look perfect and still fail. manu2print.com/kdp-pdf-checker opens the PDF the same way the structure above describes and reports what it finds — page boxes, font embedding status, color spaces, and image resolution — in plain language, before you find out the hard way.",
      },
    ],
  },
  {
    slug: "paperback-spine-disasters-field-guide",
    title: "Paperback Spine Disasters: A Field Guide",
    excerpt:
      "The spine is the narrowest, least forgiving part of any paperback cover — and the part most likely to go wrong. A visual guide to the most common spine failures, why each one happens, and the math that prevents them.",
    publishedAt: "2026-06-22",
    tags: ["kdp", "cover", "spine"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "The spine is a strip of cover real estate whose width is determined by a single number you might not think about until the cover is almost done: your final page count. Every spine problem below traces back to the spine width being calculated for the wrong page count, or text being placed without accounting for how unforgiving that narrow strip is.",
      },
      {
        type: "h2",
        text: "Disaster #1: The Title That Wraps Around the Spine",
      },
      {
        type: "p",
        text: "This happens when the front cover design was created first, at what felt like the right width, and the spine was added afterward without re-measuring. The title text — sized for a wider canvas — ends up partially wrapping onto the spine or back cover. The fix isn't to shrink the text after the fact; it's to build the full cover canvas (back + spine + front + bleed) at the correct total width from the start, using the spine width for your actual final page count.",
      },
      {
        type: "h2",
        text: "Disaster #2: Spine Text That's Off-Center — Vertically or Horizontally",
      },
      {
        type: "p",
        text: "Spine text needs to be centered within the spine's width, not the full cover's width — an easy mix-up when working in a single flat canvas. It also needs vertical clearance from the top and bottom edges, where the spine curves into the front and back covers during binding; text placed too close to those edges can get distorted or partially obscured.",
      },
      {
        type: "h2",
        text: "Disaster #3: Spine Text on a Book That's Too Thin",
      },
      {
        type: "p",
        text: "Below a certain page count, the spine is physically too narrow for legible text — and KDP either rejects spine text on very thin books or strongly discourages it. Authors who add spine text to a 60-page book and get a rejection or an unreadable sliver of letters are running into a hard physical limit: there's a minimum page count below which spine text shouldn't exist at all, regardless of how it's designed.",
      },
      {
        type: "h2",
        text: "Disaster #4: The Spine Width Was Right — Last Week",
      },
      {
        type: "p",
        text: "This is the most common real-world spine disaster, and it's invisible until the proof arrives: the cover was designed against an early page count, and then the manuscript grew or shrank — even by a handful of pages — after the cover was finalized. Spine width is a direct function of page count and paper type, so any change to either one after the cover is locked makes the spine width wrong, which shifts where the front and back panels fold, which can shift cover text right onto the fold lines.",
      },
      {
        type: "p",
        text: "The practical rule: don't finalize a cover until the interior file is finished. If the interior changes afterward by even a few pages, recalculate the spine width and adjust the cover canvas before resubmitting — don't assume \"a few pages\" is too small to matter.",
      },
      {
        type: "h2",
        text: "Disaster #5: The Barcode Box Eating Your Back Cover Design",
      },
      {
        type: "p",
        text: "If you use Amazon's free barcode, KDP places it in a fixed-size zone on the back cover — and any design element underneath it gets covered. Authors who design a full-bleed back cover without leaving that zone clear discover the problem only when the barcode appears stamped over their artwork or blurb text in the proof.",
      },
      {
        type: "h2",
        text: "The Math That Prevents All Five",
      },
      {
        type: "p",
        text: "Every one of these traces back to one calculation: spine width = page count x paper thickness factor, which depends on your paper type (white vs. cream, and the weight). Get that number right, build your canvas at the resulting total width, and most spine disasters can't happen — there's no \"off by a little\" version of a cover built at the correct dimensions from the start.",
      },
      {
        type: "p",
        text: "manu2print.com's Spine Width Calculator does this calculation for your exact page count and paper type — free, before you hand dimensions to a designer or open your cover template.",
      },
    ],
  },
  {
    slug: "3am-upload-why-authors-submit-at-worst-time",
    title: "The 3 AM Upload: Why Authors Submit at the Worst Possible Moment",
    excerpt:
      "There's a pattern in self-publishing forums: the rejections, the panic posts, the \"I just hit publish and now I'm terrified\" threads cluster at a very specific moment — the night before a launch, after months of waiting. Here's why that's the worst possible time to discover a problem, and what to do instead.",
    publishedAt: "2026-06-24",
    tags: ["kdp", "workflow", "publishing"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Spend time in self-publishing forums and a pattern emerges in the timestamps as much as the content. The most stressed, most urgent posts — \"please help, my book is rejected and it's supposed to launch tomorrow\" — cluster right before a scheduled release, often very late at night. This isn't a coincidence, and it's not really about the file. It's about when authors choose to find out whether the file works.",
      },
      {
        type: "h2",
        text: "The Sequence That Creates the 3 AM Upload",
      },
      {
        type: "p",
        text: "It usually goes like this: the manuscript is finished weeks or months ahead of the release date. The cover is finished separately, often by a different person, around the same time. Both get set aside — \"done\" — while marketing, ARC copies, and launch planning take over the remaining weeks. Then, a day or two before the scheduled release, the file gets uploaded to KDP for the first time since it was finished.",
      },
      {
        type: "p",
        text: "If anything is wrong — a margin issue, a spine miscalculation, an unembedded font — this is the moment it surfaces. With a launch date already announced, ARCs already sent, and a release calendar already public. The technical problem is often small. The timing turns it into a crisis.",
      },
      {
        type: "h2",
        text: "Why \"Finished\" and \"Checked\" Aren't the Same Thing",
      },
      {
        type: "p",
        text: "A manuscript can be finished — written, edited, proofread — without ever having been through KDP's technical checks, because those checks only run on upload. There's no \"pre-flight\" step most authors know to do earlier. The first time the file meets KDP's actual requirements is the first time it's uploaded, which is often deliberately scheduled close to release so that \"if it's approved, the date is locked in.\"",
      },
      {
        type: "p",
        text: "That logic is backwards. It means the riskiest moment — finding out whether the file is technically correct — is scheduled for when there's the least time to fix it.",
      },
      {
        type: "h2",
        text: "What Changes If You Check Earlier",
      },
      {
        type: "p",
        text: "Every category of rejection covered elsewhere on this blog — bleed, margins, spine math, font embedding, page dimensions — is checkable the moment the interior PDF and cover PDF exist, regardless of how far away the release date is. None of it requires KDP's queue. A file that's going to fail KDP's check will fail it in exactly the same way whether you find out today or the night before launch.",
      },
      {
        type: "p",
        text: "The only thing that changes is how much time you have to fix it — and whether \"fix it\" means a calm edit or a rushed one made under launch-day pressure, which is its own source of new mistakes.",
      },
      {
        type: "h2",
        text: "The Practical Shift",
      },
      {
        type: "p",
        text: "Run the technical check on your interior and cover files as soon as they're \"done\" — not as soon as you're ready to launch. Those are different milestones, and treating them as the same one is what produces the 3 AM upload. manu2print.com/kdp-pdf-checker exists for exactly that earlier moment: it runs the same category of checks KDP's upload will run, with no queue, no launch date attached, and no consequence if something needs fixing.",
      },
    ],
  },
  {
    slug: "28mb-manuscript-vs-free-pdf-tools",
    title: "What a 28MB Manuscript Does to Every \"Free PDF Tool\" on Google",
    excerpt:
      "Free online PDF tools work great in their demos — usually with a 2-page sample file. We ran a real 28MB, 300+ page manuscript through several of them to see what actually happens. The results explain a lot of forum complaints.",
    publishedAt: "2026-06-26",
    tags: ["kdp", "pdf-tools", "file-size"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Search for almost any PDF task — compress, merge, check, convert — and the results are dominated by free browser-based tools, all of which look identical: clean interface, a big drop zone, a progress bar, a download button. They all work. The question is what \"work\" means when the file isn't a 2-page sample, but a real manuscript: 300+ pages, illustrations or scans included, 28MB or more.",
      },
      {
        type: "h2",
        text: "Where Free Tools Hit a Wall",
      },
      {
        type: "p",
        text: "Most free browser-based PDF tools process files in one of two places: entirely in your browser, or by uploading the whole file to a server and processing it there. Both approaches have a size point where things change — not gracefully, usually.",
      },
      {
        type: "p",
        text: "Browser-based tools run into the memory limits of the browser tab itself. A 28MB PDF, once decompressed into working memory along with whatever the tool needs to analyze it, can be several times that size in RAM. On a phone, or a laptop with several tabs open, this is where tools silently hang, the progress bar freezes at some percentage, or the tab crashes outright.",
      },
      {
        type: "p",
        text: "Server-based tools run into upload limits and processing timeouts. Many free tools cap uploads at 10MB, 15MB, or 25MB — often without stating the limit clearly, so the failure shows up as a generic error after a long upload rather than an upfront \"file too large\" message. Others accept the upload but time out during processing, because the server allocates a fixed, short window for free-tier jobs regardless of file size.",
      },
      {
        type: "h2",
        text: "The Failure Modes Authors Actually Report",
      },
      {
        type: "p",
        text: "This matches a pattern that shows up repeatedly in self-publishing forums: a tool that worked fine for a cover file (a few MB) fails mysteriously on the interior file (tens of MB). Authors often conclude their file is corrupted or wrongly formatted — when the actual cause is that the tool simply isn't built to handle a file that size, and fails in a way that doesn't say so.",
      },
      {
        type: "p",
        text: "Common symptoms: the progress bar reaches 90% and never finishes, the download button produces a 0-byte or truncated file, or the tool \"succeeds\" but the output file is missing pages — because it silently stopped processing partway through and returned whatever it had.",
      },
      {
        type: "h2",
        text: "Why This Matters Specifically for KDP Files",
      },
      {
        type: "p",
        text: "KDP manuscripts are exactly the kind of file that trips these limits: high page counts, embedded fonts, and images at print resolution (300 DPI) all push file sizes well past the 5-10MB range that free tools are typically tested against. A children's book with full-bleed illustrations or a photography book can easily reach 50-100MB. The tools most likely to fail are the ones authors are most likely to need.",
      },
      {
        type: "h2",
        text: "What to Check Before Trusting a Tool With Your Manuscript",
      },
      {
        type: "ul",
        items: [
          "Does the tool state a maximum file size anywhere? If it doesn't say, assume there is one and it's lower than you'd guess.",
          "Does it process in your browser or upload to a server? Browser-based tools are more private but more memory-limited; server-based tools handle bigger files but may have stricter timeouts.",
          "After processing, does the output have the same page count as the input? This is the simplest check for silent truncation, and it's worth doing every time with a large file.",
        ],
      },
      {
        type: "p",
        text: "manu2print's tools — including the PDF Compressor and the Print Ready Check — are built around real manuscript sizes, not 2-page demos. If you've had a free tool quietly fail on a real book file, that's the gap these tools exist to close.",
      },
    ],
  },
  {
    slug: "250-kdp-forum-complaints-what-actually-goes-wrong",
    title: "I Read 250 KDP Forum Complaints. Here's What Actually Goes Wrong.",
    excerpt:
      "We pulled 258 real threads from KDP publishing communities and tallied every problem authors actually reported. The results don't match what most KDP advice warns you about — including ours.",
    publishedAt: "2026-06-29",
    tags: ["kdp", "rejection", "research"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Most KDP advice is written from the guidelines down: read Amazon's requirements, turn each one into a tip, publish. We wanted to work from the other direction — from what authors actually struggle with, in their own words. So we pulled 258 unique threads from the two largest self-publishing communities on Reddit, searching for rejections, errors, and upload failures, and read all of them.",
      },
      {
        type: "p",
        text: "About 120 of those threads describe a concrete KDP problem — a rejection, an error message, a block, a file that wouldn't go through. We tallied every one. Here's the ranking, and then the three findings that surprised us.",
      },
      {
        type: "h2",
        text: "The Tally: What Actually Rejects Books",
      },
      {
        type: "ul",
        items: [
          "Bleed and margin rejections — roughly 1 in 4 problem threads. \"Insufficient bleed,\" \"margins are messed up,\" and the infamous instruction to \"add 0.125 inches to your page width and 0.25 inches to the page height\" that almost nobody interprets correctly.",
          "Cover dimension math — roughly 1 in 5. The classic error reads like \"expected cover size is 11.304 x 8.750 but the submitted file is 11.000 x 8.500.\" That gap is spine width, calculated from page count and paper type. One author in our sample was rejected 30 times on the same cover.",
          "Metadata and content blocks — about 1 in 6. \"Misleading customer experience,\" titles rejected for containing the word \"bestseller,\" category errors that loop endlessly, and demands to prove you own rights to your own book.",
          "Vague rejections — about 1 in 8 threads describe a rejection with no usable reason given, where even KDP support couldn't explain the failure.",
          "Everything else — account and identity blocks, \"error processing interior\" failures, ebooks that render perfectly in Previewer and break on the phone app, and physical print defects.",
        ],
      },
      {
        type: "h2",
        text: "Surprise #1: The Same File Passes, Then Fails",
      },
      {
        type: "p",
        text: "The angriest threads in the sample aren't from first-time publishers. They're from authors whose file had already been accepted — and then got rejected after a trivial change. One author fixed typos in a manuscript that had been live for months; the resubmission was rejected for bleed on a map that hadn't changed. Another increased the font size on an already-approved cover and got locked into a \"cover size incorrect\" loop.",
      },
      {
        type: "p",
        text: "The lesson hiding in these threads: passing KDP review once doesn't mean your file is compliant. It can mean the check tolerated something that the next pass won't. Files that sit near the edge of a requirement — margins at the exact minimum, bleed barely covered — are coin flips on every resubmission.",
      },
      {
        type: "h2",
        text: "Surprise #2: \"My Proof Printed Perfectly\"",
      },
      {
        type: "p",
        text: "A recurring, maddening pattern: the author orders proof copies, the proofs arrive flawless, and the automated check still rejects the file for bleed or margins. One author described their pass rate as a gamble — \"50% of my books pass, while 50% do not\" — with identical setup.",
      },
      {
        type: "p",
        text: "This happens because the printed proof and the automated check are testing different things. The proof shows whether the file prints acceptably; the checker measures whether the file's stated geometry — page boxes, declared sizes, margin distances — matches the selected trim and bleed settings exactly. A file can print beautifully while its internal dimensions are technically wrong, and the checker only cares about the second thing.",
      },
      {
        type: "h2",
        text: "Surprise #3: Fonts Are Over-Blogged and Under-Complained",
      },
      {
        type: "p",
        text: "Every KDP guide warns about font embedding — including ours. Total font-related complaints in 258 real threads: one. And it was about a cover font license, not embedding.",
      },
      {
        type: "p",
        text: "Meanwhile bleed, margins, and cover dimension math — the unglamorous measurement problems — account for nearly half of all real rejections in the sample. The advice ecosystem has it backwards: the thing bloggers love to explain is rare, and the thing that actually rejects books gets a paragraph of boilerplate. If you're going to obsess over one part of your file, obsess over the geometry.",
      },
      {
        type: "h2",
        text: "What This Means Before Your Next Upload",
      },
      {
        type: "p",
        text: "The complaints cluster almost entirely around things that are measurable before you upload: bleed coverage, margin distances, exact page dimensions, and the cover canvas math that depends on your final page count. None of it requires guessing. All of it is checkable.",
      },
      {
        type: "p",
        text: "That's what the Print Ready Check at manu2print.com/kdp-pdf-checker does — it measures your PDF's actual geometry against KDP's requirements and names every failure in plain language before Amazon does. Based on 258 threads of evidence: it's the boring measurements, not the exotic edge cases, that send books back.",
      },
    ],
  },
  {
    slug: "kdp-rejection-email-translated",
    title: "The KDP Rejection Email, Translated",
    excerpt:
      "Amazon's rejection emails are written in a careful, vague dialect that tells you something is wrong without telling you what. Here's what each phrase actually means — and exactly what to fix before you resubmit.",
    publishedAt: "2026-06-12",
    tags: ["kdp", "rejection", "troubleshooting"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "If you've ever received a KDP rejection email, you know the feeling: you read it twice, and you still don't know what to fix. That's not an accident of bad writing. Amazon's review messages are deliberately generic — one template covers hundreds of possible technical failures. The result is an email that says something is wrong without saying what.",
      },
      {
        type: "p",
        text: "This post is a translation guide. Below are the phrases that appear most often in KDP rejection and review emails, what each one actually means in technical terms, and what to check before you resubmit.",
      },
      {
        type: "h2",
        text: "\"Your interior file does not meet our specifications\"",
      },
      {
        type: "p",
        text: "This is the broadest one, and it almost always means a measurable, mechanical problem — not a quality judgement on your book. In practice it usually comes down to one of four things: the PDF page size doesn't match the trim size you selected, the margins are smaller than KDP's minimums for your page count, content sits inside the bleed or trim zone, or the page count in the file doesn't match what the cover spine was calculated for.",
      },
      {
        type: "ul",
        items: [
          "Open your PDF and check the actual page dimensions against your selected trim size — exactly, not approximately.",
          "Check margins against KDP's minimums, which increase with page count. A 350-page book needs a larger gutter than a 120-page book.",
          "If you uploaded with bleed, confirm every page is sized to trim plus 0.125\" on the three outer edges.",
        ],
      },
      {
        type: "h2",
        text: "\"Fonts are not embedded\"",
      },
      {
        type: "p",
        text: "This one at least names the problem, but it confuses people because the file looks fine on their screen. Of course it does — the fonts are installed on your computer. They're not inside the PDF, which means Amazon's printer can't reproduce them. The file you see and the file you sent are not the same thing.",
      },
      {
        type: "p",
        text: "The fix depends on your tool. In Word: File → Options → Save → tick \"Embed fonts in the file\" before exporting. In Canva: download as PDF Print, not PDF Standard. In InDesign and Vellum, embedding is automatic — if you're getting this error from those tools, the culprit is usually a font inside a placed image or a font with licensing restrictions that blocks embedding.",
      },
      {
        type: "h2",
        text: "\"Your cover does not meet our requirements\"",
      },
      {
        type: "p",
        text: "Cover rejections are nearly always dimensional. The full cover canvas is back cover + spine + front cover + bleed on all four sides, and the spine width is calculated from your exact page count and paper type. If your page count changed after the cover was designed — even by a few pages — the spine width is wrong and the whole cover is the wrong size.",
      },
      {
        type: "ul",
        items: [
          "Recalculate spine width with your final page count and paper type, not the count from your draft.",
          "Check that no text sits on or near the spine fold lines — KDP wants spine text to have clearance on books under 80 pages, and no spine text at all under a certain thickness.",
          "Confirm the barcode zone on the back cover is clear if you're using Amazon's barcode.",
        ],
      },
      {
        type: "h2",
        text: "\"Content within your book is in violation of our guidelines\"",
      },
      {
        type: "p",
        text: "This is the scariest phrase and often the most mundane problem. Yes, it covers genuinely prohibited content — but for most indie authors it's triggered by something procedural: a copyright page that references a different ISBN or publisher than the one on the account, links to competitor retailers inside the book, placeholder text left in from a template (\"Insert dedication here\"), or metadata keywords that violate KDP's keyword rules.",
      },
      {
        type: "p",
        text: "Read your front matter and back matter as a reviewer would. The body of your book is rarely the issue — the boilerplate pages around it usually are.",
      },
      {
        type: "h2",
        text: "\"We are unable to publish your book at this time\"",
      },
      {
        type: "p",
        text: "Translation: a human or automated check failed and the specific reason is in the rest of the email — this sentence itself carries no information. If the email genuinely gives no specifics anywhere, reply to it and ask. KDP support will usually name the failing check when asked directly, and \"please tell me the specific issue with my file\" is a perfectly normal request.",
      },
      {
        type: "h2",
        text: "The Pattern Behind All of It",
      },
      {
        type: "p",
        text: "Almost every phrase above maps to a small set of measurable file problems: page size, margins, bleed, font embedding, spine math, image resolution. These are checkable before you upload. The rejection email is vague — the underlying checks are not.",
      },
      {
        type: "p",
        text: "That's exactly what the Print Ready Check at manu2print.com/kdp-pdf-checker does: it runs your PDF through the same category of technical checks and names each failure in plain language, with the fix. Decode the email after the fact, or skip the email entirely.",
      },
    ],
  },
  {
    slug: "vellum-vs-word-vs-canva-for-kdp",
    title: "Vellum vs Word vs Canva for KDP — What Actually Passes",
    excerpt:
      "Three of the most popular tools for formatting KDP books — and three very different track records with Amazon's upload checker. Here's what each one gets right, what it misses, and what to check before you upload.",
    publishedAt: "2026-05-15",
    tags: ["kdp", "formatting", "canva"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "The tool you use to format your book matters less than whether the output meets KDP's technical requirements. A beautifully formatted Vellum file can still get rejected. A simple Word document can pass first time. The question isn't which tool is best — it's what each one tends to get wrong.",
      },
      {
        type: "h2",
        text: "Vellum",
      },
      {
        type: "p",
        text: "Vellum produces some of the cleanest book interiors available. Font embedding is handled correctly. Page dimensions are accurate. The output is professional and consistent. For most KDP books, a Vellum-formatted file passes without issues.",
      },
      {
        type: "p",
        text: "Where Vellum can trip up: it's Mac-only and expensive, so many authors use an older version or borrow access. Older versions occasionally have issues with specific trim sizes or bleed handling. And Vellum's gutter margins are set automatically — which is usually correct, but worth verifying if your book is unusually long or short.",
      },
      {
        type: "h2",
        text: "Microsoft Word",
      },
      {
        type: "p",
        text: "Word is the most commonly used formatting tool and the most commonly blamed for KDP rejections. Most of those rejections aren't Word's fault — they're setup errors. The tool does what you tell it to do.",
      },
      {
        type: "p",
        text: "The most common Word-related failures: page size set to A4 or US Letter instead of the KDP trim size, margins not adjusted for the correct gutter, fonts not embedded when saving to PDF (fix this in Options → Save → Embed fonts in the file), and images dropped in at screen resolution rather than 300 DPI.",
      },
      {
        type: "p",
        text: "Word can produce a perfectly KDP-compliant file. It just requires more manual setup than Vellum.",
      },
      {
        type: "h2",
        text: "Canva",
      },
      {
        type: "p",
        text: "Canva is the highest-risk option for KDP formatting, particularly for interior pages. It was built for digital design, not print production, and the gap between the two shows up in specific ways.",
      },
      {
        type: "p",
        text: "The issues that come up most with Canva: bleed not enabled or not extended properly into the bleed zone, fonts not embedded in the PDF export (use PDF Print, not PDF Standard), colour mode in RGB rather than CMYK, and page dimensions that are close to but not exactly the required trim size.",
      },
      {
        type: "p",
        text: "For covers and design-heavy interiors, Canva can work — but it requires specific export settings and a file check before upload.",
      },
      {
        type: "h2",
        text: "The Common Thread",
      },
      {
        type: "p",
        text: "Every tool can produce a file that passes KDP. Every tool can also produce one that fails. The difference is almost always in the details of the setup — page size, margins, bleed, font embedding, image resolution.",
      },
      {
        type: "p",
        text: "Check your file before you upload regardless of which tool you used. manu2print.com/kdp-pdf-checker runs the technical checks on any PDF — Vellum, Word, Canva, or anything else — and tells you what needs fixing before Amazon does.",
      },
    ],
  },
  {
    slug: "kdp-cover-requirements-bleed-spine-dimensions",
    title: "KDP Cover Requirements: Bleed, Spine Width, and Why the Calculator Matters",
    excerpt:
      "Your KDP cover dimensions aren't just width and height. They include bleed, spine width based on your page count, and paper type. Get any of these wrong and the cover gets rejected before anyone sees it.",
    publishedAt: "2026-05-13",
    tags: ["kdp", "formatting", "bleed"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "The cover is the most rejected file in KDP publishing. Not because authors don't try — they do. It's because a KDP cover isn't just a design. It's a precise technical document with dimensions that depend on four separate variables working together.",
      },
      {
        type: "h2",
        text: "What Goes Into a KDP Cover Dimension",
      },
      {
        type: "p",
        text: "Your cover file needs to be a single flat PDF that wraps around the entire book — back cover, spine, and front cover as one piece. The dimensions of that file are calculated from:",
      },
      {
        type: "ul",
        items: [
          "Trim size — the width and height of your book's pages",
          "Spine width — calculated from your page count and paper type",
          "Bleed — 0.125 inches added to all four outer edges",
          "Paper type — white paper vs cream paper affects spine width",
        ],
      },
      {
        type: "p",
        text: "Change any one of these and your cover dimensions change. Submit a cover built for 250 pages when your interior is 275 pages and the spine width is wrong — rejected.",
      },
      {
        type: "h2",
        text: "How Spine Width Is Calculated",
      },
      {
        type: "p",
        text: "KDP calculates spine width as: page count multiplied by the paper thickness. For white paper, that's 0.002252 inches per page. For cream paper, it's 0.0025 inches per page.",
      },
      {
        type: "p",
        text: "A 300-page book on white paper has a spine of 300 x 0.002252 = 0.6756 inches. Round up to 0.676 inches. A 300-page book on cream paper: 300 x 0.0025 = 0.75 inches. The difference matters when designing your spine text and logo placement.",
      },
      {
        type: "p",
        text: "Note: KDP requires a minimum of 100 pages for spine text to be allowed. Below that, the spine is too narrow to print text reliably.",
      },
      {
        type: "h2",
        text: "The Full Cover Width Formula",
      },
      {
        type: "p",
        text: "Total cover width = (trim width x 2) + spine width + (0.125 x 2 for bleed). Total cover height = trim height + (0.125 x 2 for bleed).",
      },
      {
        type: "p",
        text: "For a 6 x 9 inch book, 300 pages, white paper: width = (6 x 2) + 0.676 + 0.25 = 12.926 inches. Height = 9 + 0.25 = 9.25 inches.",
      },
      {
        type: "h2",
        text: "Use the KDP Cover Calculator",
      },
      {
        type: "p",
        text: "KDP provides a free cover calculator at kdp.amazon.com/cover-calculator that outputs the exact dimensions for your book. Use it every time. Do not guess. Do not reuse dimensions from a previous book unless the page count and paper type are identical.",
      },
      {
        type: "p",
        text: "Build your cover to those exact dimensions, add bleed on all four outer edges, and keep all critical text and logos within the safe zone — 0.125 inches from any edge. Our Spine Width Calculator at manu2print.com/spine-calculator also gives you these dimensions quickly.",
      },
    ],
  },
  {
    slug: "how-long-does-kdp-review-take",
    title: "How Long Does KDP Review Take — And Why Yours Is Taking Longer",
    excerpt:
      "KDP says 72 hours. Your book has been in review for five days. Here's what's actually happening and what you can do about it.",
    publishedAt: "2026-05-11",
    tags: ["kdp", "rejection"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "KDP's official position is that review takes up to 72 hours. In practice, most books are reviewed in 24-48 hours. When yours takes longer, it usually means one of three things.",
      },
      {
        type: "h2",
        text: "What Happens During KDP Review",
      },
      {
        type: "p",
        text: "When you submit a book, KDP runs two types of review. The first is automated — a technical check of your files against their formatting requirements. Trim size, margins, bleed, font embedding, image resolution. This happens quickly.",
      },
      {
        type: "p",
        text: "The second is manual — a human reviewer checks your content against KDP's content guidelines. This is where delays happen. Manual review is triggered when the automated system flags something for human eyes, or when content falls into categories KDP monitors closely.",
      },
      {
        type: "h2",
        text: "Why Your Review Is Taking Longer Than 72 Hours",
      },
      {
        type: "ul",
        items: [
          "Your file triggered a flag in the automated check — not enough to reject outright, but enough to send it to manual review",
          "Your content is in a category KDP scrutinises more carefully — health, finance, relationships, anything adjacent to their quality guidelines",
          "High submission volume — KDP sees millions of uploads and review times stretch during peak periods",
          "Your title or cover contains elements that triggered keyword or image review",
          "You've had previous submissions flagged from the same account",
        ],
      },
      {
        type: "h2",
        text: "What You Can Do",
      },
      {
        type: "p",
        text: "If it's been less than 5 business days: wait. Contacting KDP support during this window rarely speeds things up and occasionally resets your position in the queue.",
      },
      {
        type: "p",
        text: "If it's been more than 5 business days: contact KDP support directly through your KDP account. Have your ASIN and submission date ready. Ask for a status update. Most cases resolve within 24 hours of contact.",
      },
      {
        type: "p",
        text: "If you're repeatedly experiencing long review times: check whether your files are technically clean before submission. Files that pass the automated check cleanly are less likely to be escalated. The KDP PDF Checker at manu2print.com/kdp-pdf-checker checks your interior file against KDP's technical requirements before you upload — reducing the chance of flags at the automated stage.",
      },
      {
        type: "h2",
        text: "The One Thing That Consistently Speeds Up Review",
      },
      {
        type: "p",
        text: "Submit a technically clean file the first time. KDP's automated system is looking for reasons to escalate. Margin violations, missing bleed, unembedded fonts — each one is a flag. A file that passes every automated check moves through the system faster.",
      },
      {
        type: "p",
        text: "Check before you upload. It's the one variable you can control.",
      },
    ],
  },
  {
    slug: "you-paid-a-fiverr-formatter-kdp-still-rejected-it",
    title: "You Paid a Fiverr Formatter. KDP Still Rejected It. Here's Why.",
    excerpt:
      "Hiring someone on Fiverr to format your KDP book doesn't guarantee it passes. Here's what most cheap formatters miss — and how to verify any file before it goes to Amazon.",
    publishedAt: "2026-05-06",
    tags: ["kdp", "formatting", "rejection"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "You did everything right. You hired a professional. You paid them. They delivered a file. You uploaded it to KDP. Rejected.",
      },
      {
        type: "p",
        text: "This happens more than most people admit. Fiverr and Upwork are full of KDP formatting gigs at $5, $10, $25. Some of them are excellent. Many of them are not. And the painful part is you usually can't tell the difference until Amazon tells you.",
      },
      {
        type: "h2",
        text: "Why Cheap Formatters Miss the Same Things Every Time",
      },
      {
        type: "p",
        text: "Most budget formatting gigs on Fiverr focus on making your book look good on screen. That's not the same as making it pass KDP's technical checks. A file can look perfect in preview and still fail on four different technical requirements.",
      },
      {
        type: "p",
        text: "The things that get missed most often:",
      },
      {
        type: "ul",
        items: [
          "Gutter margins set to a fixed width regardless of page count — KDP requires wider gutters for longer books",
          "Bleed area missing or incorrect — if your design touches the page edge, KDP needs exactly 0.125 inches of bleed beyond the trim line",
          "Fonts not fully embedded — looks fine on their machine, fails on KDP's servers",
          "Page dimensions slightly off from the selected trim size — a fraction of an inch triggers a rejection",
          "Images below 300 DPI — fine on screen, blurry in print, flagged by KDP",
        ],
      },
      {
        type: "p",
        text: "None of these are visible to the eye. They require a technical check of the file itself — not just opening it and looking at it.",
      },
      {
        type: "h2",
        text: "The Real Problem: Most Formatters Don't Check Their Own Output",
      },
      {
        type: "p",
        text: "A good formatter checks their work before delivering it. They run the file through a preflight process — verifying margins, bleed, font embedding, image resolution, and page dimensions against KDP's exact requirements.",
      },
      {
        type: "p",
        text: "A cheap formatter delivers what they built and hopes it passes. The $5 gig price makes that pretty clear.",
      },
      {
        type: "p",
        text: "This isn't an indictment of Fiverr. There are talented formatters on the platform. But at the budget end of the market, the economics don't support proper quality control — and you end up paying twice. Once to the formatter, once when you hire someone to fix it.",
      },
      {
        type: "h2",
        text: "What to Do Before You Upload Any File",
      },
      {
        type: "p",
        text: "Whether you formatted the book yourself, hired someone on Fiverr, or used Vellum — run the PDF through a preflight check before it goes to Amazon. Every time.",
      },
      {
        type: "p",
        text: "The KDP PDF Checker at manu2print.com/kdp-pdf-checker checks your file against KDP's actual requirements: trim size, margins, bleed, font embedding, and image resolution. It flags every issue by page number with plain-English fix instructions.",
      },
      {
        type: "p",
        text: "If your formatter's file passes, great — you can upload with confidence. If it doesn't, you know exactly what to send back to them to fix before Amazon sees it.",
      },
      {
        type: "h2",
        text: "If You're a Formatter: This Is Your Quality Gate",
      },
      {
        type: "p",
        text: "If you format books for clients — on Fiverr, Upwork, or independently — running every file through a preflight check before delivery is what separates you from the $5 gigs. It takes 90 seconds. It means you deliver files you know will pass. It means your clients don't come back furious after a rejection.",
      },
      {
        type: "p",
        text: "The difference between a formatter clients recommend and one they warn people about is usually this: did you verify the file before you delivered it?",
      },
      {
        type: "p",
        text: "Check any file at manu2print.com/kdp-pdf-checker. Free score preview. No account needed.",
      },
    ],
  },
  {
    slug: "kdp-trim-sizes-complete-guide-2026",
    title: "KDP Trim Sizes: The Complete Guide for 2026",
    excerpt:
      "Choosing the wrong KDP trim size is one of the most common reasons files get rejected. Here are all the standard sizes, which ones work best for each book type, and how to set them up correctly.",
    publishedAt: "2026-05-06",
    tags: ["kdp", "formatting", "margins"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Your PDF page size must match your KDP trim size exactly. Not approximately. Exactly. A mismatch of even a fraction of an inch triggers an automatic rejection — and Amazon's error message won't tell you which page caused the problem.",
      },
      {
        type: "p",
        text: "Here's everything you need to know about KDP trim sizes before you set up your document.",
      },
      {
        type: "h2",
        text: "What Is a Trim Size?",
      },
      {
        type: "p",
        text: "The trim size is the final physical size of your printed book after the printer cuts the pages. When you set up your document in Word, Canva, Vellum, or any other tool, the page dimensions must match your chosen trim size exactly.",
      },
      {
        type: "p",
        text: "If you select 6 x 9 inches as your trim size in KDP, every page of your PDF must be exactly 6 x 9 inches — or 6.25 x 9.25 inches if you're using bleed.",
      },
      {
        type: "h2",
        text: "Standard KDP Trim Sizes",
      },
      {
        type: "ul",
        items: [
          "5 x 8 inches — fiction, novels, memoirs",
          "5.06 x 7.81 inches — fiction, standard paperback",
          "5.25 x 8 inches — fiction, trade paperback",
          "5.5 x 8.5 inches — most popular overall, fiction and nonfiction",
          "6 x 9 inches — nonfiction, business, self-help, most common for KDP",
          "6.14 x 9.21 inches — standard trade paperback",
          "7 x 10 inches — textbooks, workbooks, large format nonfiction",
          "8 x 10 inches — children's books, activity books",
          "8.5 x 8.5 inches — children's books, square format",
          "8.5 x 11 inches — journals, planners, workbooks, large format",
        ],
      },
      {
        type: "h2",
        text: "Which Trim Size Should You Choose?",
      },
      {
        type: "p",
        text: "For most nonfiction, business, or self-help books: 6 x 9 inches. It's the industry standard and what readers expect.",
      },
      {
        type: "p",
        text: "For fiction and novels: 5.5 x 8.5 inches or 5 x 8 inches. These feel like trade paperbacks and sit comfortably in a reader's hand.",
      },
      {
        type: "p",
        text: "For journals, planners, and low-content books: 8.5 x 11 inches or 6 x 9 inches depending on how much writing space you want per page.",
      },
      {
        type: "p",
        text: "For children's books: 8 x 10 inches or 8.5 x 8.5 inches — square or near-square formats that work well with full-page illustrations.",
      },
      {
        type: "h2",
        text: "The Bleed Rule",
      },
      {
        type: "p",
        text: "If any element in your design touches the edge of the page — a background colour, an image, a border — you need to add bleed. This means your PDF page dimensions need to be 0.25 inches larger in each dimension (0.125 inches on each side). A 6 x 9 inch book with bleed needs a PDF page size of 6.25 x 9.25 inches.",
      },
      {
        type: "p",
        text: "If no element touches the page edge, use the trim size dimensions exactly with no bleed.",
      },
      {
        type: "h2",
        text: "Check Your Trim Size Before You Upload",
      },
      {
        type: "p",
        text: "The KDP PDF Checker at manu2print.com/kdp-pdf-checker automatically checks your PDF page dimensions against your selected KDP trim size and flags any mismatch before Amazon sees your file. Free score preview, no account needed.",
      },
    ],
  },
  {
    slug: "kdp-upload-checklist-12-things-to-verify",
    title: "The KDP Upload Checklist: 12 Things to Verify Before You Submit",
    excerpt:
      "Most KDP rejections come from a small set of fixable issues. Run through this checklist before every upload and you'll avoid the rejection cycle entirely.",
    publishedAt: "2026-05-06",
    tags: ["kdp", "formatting", "preflight"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "KDP's automated review catches the same issues every time. Most of them are preventable with a 10-minute check before you upload. Here's the exact list.",
      },
      {
        type: "h2",
        text: "File Setup",
      },
      {
        type: "ul",
        items: [
          "1. Page dimensions match your KDP trim size exactly — not approximately, exactly",
          "2. If using bleed, page dimensions are 0.25 inches larger than your trim size (0.125 inches added on each side)",
          "3. PDF is not password protected or encrypted",
          "4. File size is under 650MB",
        ],
      },
      {
        type: "h2",
        text: "Margins",
      },
      {
        type: "ul",
        items: [
          "5. Outer margins (top, bottom, outside edge) are at least 0.25 inches — 0.5 inches recommended",
          "6. Inner margin (gutter) meets the minimum for your page count: 0.375\" for under 150 pages, 0.75\" for 151-300 pages, 0.875\" for 301-500 pages, 1\" for 500+ pages",
          "7. No text or images crossing into the margin area on any page",
        ],
      },
      {
        type: "h2",
        text: "Fonts and Images",
      },
      {
        type: "ul",
        items: [
          "8. All fonts are fully embedded — check via File → Properties → Fonts in Acrobat Reader, every font should say Embedded or Embedded Subset",
          "9. All images are at least 300 DPI — images below 200 DPI will print blurry",
          "10. No images with transparency issues that could cause rendering problems",
        ],
      },
      {
        type: "h2",
        text: "Final Checks",
      },
      {
        type: "ul",
        items: [
          "11. Page count matches what you entered in KDP — a significant mismatch can cause issues",
          "12. No blank pages at the end of the file unless intentional — some tools add these automatically",
        ],
      },
      {
        type: "h2",
        text: "The Faster Way to Run This Checklist",
      },
      {
        type: "p",
        text: "Checking all 12 manually takes time and it's easy to miss something. The KDP PDF Checker at manu2print.com/kdp-pdf-checker runs every item on this list automatically and flags issues by page number — so you know exactly what to fix before Amazon sees your file.",
      },
      {
        type: "p",
        text: "Free score preview. No account needed. 90 seconds and you'll know exactly where your file stands.",
      },
    ],
  },
  {
    slug: "kdp-bleed-settings-explained",
    title: "KDP Bleed Settings Explained: What It Is, When You Need It, and How to Get It Right",
    excerpt:
      "Bleed is one of the most common reasons KDP rejects a PDF — and one of the least explained. Here's exactly what it is, when you need it, and how to set it up correctly before you upload.",
    publishedAt: "2026-05-05",
    tags: ["kdp", "formatting", "bleed"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "If you've ever had KDP reject your file and the email mentioned bleed — or if you're not sure whether your file needs it — this post will clear it up.",
      },
      {
        type: "h2",
        text: "What Bleed Actually Means",
      },
      {
        type: "p",
        text: "When a book is printed, the pages get trimmed. A physical blade cuts along the edge of each page to give the book its final size. That cut is never perfectly precise — it can shift by a tiny fraction of an inch in either direction.",
      },
      {
        type: "p",
        text: "Bleed is the extra content you add beyond the trim line to account for that shift. If your design has a background colour or an image that runs to the edge of the page, bleed is what stops a thin white strip from appearing along the edge after trimming.",
      },
      {
        type: "p",
        text: "KDP requires 0.125 inches of bleed on all sides when any element in your design touches the page edge.",
      },
      {
        type: "h2",
        text: "When You Need Bleed — and When You Don't",
      },
      {
        type: "p",
        text: "Not every book needs bleed. If your interior pages have white backgrounds and your content stays within the margins — text only, no edge-to-edge design elements — you don't need bleed on the interior.",
      },
      {
        type: "p",
        text: "You need bleed when:",
      },
      {
        type: "ul",
        items: [
          "Any background colour extends to the edge of the page",
          "An image or graphic touches or goes past the page edge",
          "You're designing a journal, planner, or colouring book with full-page backgrounds",
          "Your cover design — which almost always needs bleed",
        ],
      },
      {
        type: "p",
        text: "If you're unsure, check your design. If anything touches the edge of the canvas, you need bleed.",
      },
      {
        type: "h2",
        text: "How to Set Up Bleed in Canva",
      },
      {
        type: "p",
        text: "Canva has a bleed setting but it's easy to miss. When you go to download your file as a PDF, click the dropdown under File type, select PDF Print, and check the box that says Crop marks and bleed. That adds the 0.125 inch bleed zone automatically.",
      },
      {
        type: "p",
        text: "Important: your design elements need to actually extend into that bleed zone. Turning on bleed in the export settings doesn't automatically extend your background — you need to drag your design elements slightly past the canvas edge so they fill the bleed area.",
      },
      {
        type: "h2",
        text: "How KDP Checks for Bleed",
      },
      {
        type: "p",
        text: "When you upload a PDF, KDP checks whether the page dimensions include bleed. If your design has elements at the page edge but your PDF doesn't include a bleed area, KDP flags it. The rejection email will usually mention trim size or bleed — but it won't tell you exactly which pages are affected.",
      },
      {
        type: "p",
        text: "That's the frustrating part. You can have 200 pages that are fine and one page with a background that touches the edge — and the whole file gets rejected.",
      },
      {
        type: "h2",
        text: "Check Your Bleed Before You Upload",
      },
      {
        type: "p",
        text: "The KDP PDF Checker at manu2print.com/kdp-pdf-checker checks your bleed settings page by page — so you know exactly which pages have issues before Amazon sees your file. Upload your PDF, get a readiness score, and fix the specific pages that need attention.",
      },
      {
        type: "p",
        text: "Free score preview. No account needed. Takes about 90 seconds.",
      },
    ],
  },
  {
    slug: "kdp-font-embedding-why-pdf-gets-rejected",
    title: "KDP Font Embedding: Why Your PDF Looks Fine But Gets Rejected",
    excerpt:
      "Your PDF looks perfect on screen. The text is there, the fonts render correctly — and KDP still rejects it. Font embedding is usually why. Here's what it means and how to fix it.",
    publishedAt: "2026-05-05",
    tags: ["kdp", "formatting", "rejection"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "This is one of the most confusing KDP rejections to get. Your file looks completely normal. You open it, the text is there, everything renders correctly. KDP rejects it anyway.",
      },
      {
        type: "p",
        text: "Font embedding is usually why.",
      },
      {
        type: "h2",
        text: "What Font Embedding Means",
      },
      {
        type: "p",
        text: "When you create a PDF, your software has two options for handling fonts. It can embed the font — meaning it bakes the actual font data into the PDF file itself. Or it can reference the font — meaning the PDF just notes which font was used and assumes it will be available on whatever device opens the file.",
      },
      {
        type: "p",
        text: "On your computer, referenced fonts work fine because the fonts are installed. The PDF renders correctly every time you open it. But when you send that file to KDP's servers, those fonts might not be there. KDP requires every font to be embedded — fully baked into the file — so it can render your text accurately when printing.",
      },
      {
        type: "p",
        text: "If a font isn't embedded, KDP rejects the file.",
      },
      {
        type: "h2",
        text: "Which Tools Cause This Problem",
      },
      {
        type: "p",
        text: "Not all PDF export tools embed fonts by default. Some of the most common culprits:",
      },
      {
        type: "ul",
        items: [
          "Canva — certain free fonts and some export settings skip embedding. Always export as PDF Print, not PDF Standard.",
          "Google Docs — the built-in PDF export sometimes fails to embed fonts correctly, especially with custom fonts added via Google Fonts.",
          "Microsoft Word — generally embeds fonts if you use the Save As PDF option, but can miss fonts if the document was edited across multiple devices.",
          "Online PDF converters — many strip font data during conversion to reduce file size.",
        ],
      },
      {
        type: "h2",
        text: "How to Check if Your Fonts Are Embedded",
      },
      {
        type: "p",
        text: "In Adobe Acrobat Reader, go to File → Properties → Fonts. Every font listed should say Embedded or Embedded Subset next to it. If any font shows without that label, it's not embedded and KDP will flag it.",
      },
      {
        type: "p",
        text: "This works but it's manual. If your document uses multiple fonts — body text, headings, pull quotes — you'll need to check each one individually.",
      },
      {
        type: "h2",
        text: "How to Fix It",
      },
      {
        type: "p",
        text: "In Canva: re-export using PDF Print (not PDF Standard) and stick to fonts that are clearly marked as print-safe. If you're unsure about a specific font, swap it for a common one like Montserrat, Lato, or Merriweather — these embed reliably.",
      },
      {
        type: "p",
        text: "In Word: go to Options → Save → check the box that says Embed fonts in the file before exporting.",
      },
      {
        type: "p",
        text: "In Google Docs: download as PDF and then run it through a tool that checks embedding before you upload to KDP.",
      },
      {
        type: "h2",
        text: "Catch It Before KDP Does",
      },
      {
        type: "p",
        text: "The KDP PDF Checker at manu2print.com/kdp-pdf-checker checks font embedding automatically as part of your readiness scan. If any font in your file isn't embedded, it flags it by page — so you know exactly where the issue is and what to fix.",
      },
      {
        type: "p",
        text: "Free score preview. No account needed. Two minutes and you'll know exactly where your file stands before you submit.",
      },
    ],
  },
  {
    slug: "how-to-check-kdp-pdf-before-upload",
    title: "How to Check Your KDP PDF Before You Upload",
    excerpt:
      "Most KDP PDF rejections come down to five technical checks Amazon runs before anyone reads your book. Here's how to find and fix them before you submit.",
    publishedAt: "2026-05-01",
    tags: ["kdp", "formatting", "preflight"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Most KDP PDF rejections are avoidable. The issue is that Amazon doesn't tell you what's wrong until after you've uploaded — and by then you've already waited days for a vague email that doesn't help much.",
      },
      {
        type: "p",
        text: "A quick check before you upload can save you that whole cycle. It takes a couple of minutes and can spare you days of waiting and guesswork.",
      },
      {
        type: "h2",
        text: "What KDP Actually Checks",
      },
      {
        type: "p",
        text: "When you submit a manuscript, KDP runs a set of technical checks before anyone looks at your book. Most rejections happen here — not because of your content, but because the file doesn't meet their spec.",
      },
      {
        type: "p",
        text: "These are the five things KDP checks first:",
      },
      {
        type: "ul",
        items: [
          "Trim size — your page dimensions must match the trim size you selected in KDP exactly. Even a small mismatch triggers a rejection.",
          "Margins — outer margins need to be at least 0.25 inches. The inner margin (gutter) scales with page count. A longer book needs more space so text doesn't disappear into the binding.",
          "Bleed — if anything in your design runs to the edge of the page, you need a 0.125 inch bleed area. Skip it and you'll get a thin white strip on the printed edge.",
          "Font embedding — every font must be embedded in your PDF. Some tools export without embedding fonts, and you won't see the problem until KDP flags it.",
          "Image resolution — KDP expects 300 DPI minimum for print. Images below 200 DPI can look fine on screen but come out blurry on paper.",
        ],
      },
      {
        type: "p",
        text: "The tricky part is that most of these issues aren't visible just by looking at your file.",
      },
      {
        type: "h2",
        text: "The Manual Way",
      },
      {
        type: "p",
        text: "You can check some of this yourself. Open your PDF in Adobe Acrobat Reader and go to File → Properties → Fonts. Each font should say Embedded or Embedded Subset. If not, that's a problem.",
      },
      {
        type: "p",
        text: "You can also check page dimensions in document properties. Make sure they match your chosen KDP trim size exactly — for example, 6 × 9 inches for a standard paperback.",
      },
      {
        type: "p",
        text: "Margins and bleed are harder. You'd need to measure manually or use Adobe Acrobat Pro's preflight tool — which works, but takes time to set up if you haven't used it before. Checking image resolution means inspecting images one by one. It's doable, but slow, and easy to miss something.",
      },
      {
        type: "h2",
        text: "The Faster Way",
      },
      {
        type: "p",
        text: "The KDP PDF Checker at manu2print.com/kdp-pdf-checker was built specifically for this. Upload your PDF and it checks all five issues automatically — trim size, margins, bleed, font embedding, and image resolution — and gives you a readiness score in seconds.",
      },
      {
        type: "p",
        text: "The free score preview tells you whether your file has problems. The full annotated report ($9) shows exactly which pages have issues, what's wrong, and how to fix it. Most authors fix everything in under an hour, then upload once and get approved.",
      },
      {
        type: "h2",
        text: "Before Your Next Upload",
      },
      {
        type: "p",
        text: "The KDP rejection cycle feels unavoidable until you understand what's actually being checked. Once you know the five areas, you can review them in a couple of minutes before you submit.",
      },
      {
        type: "p",
        text: "Check your KDP PDF at manu2print.com/kdp-pdf-checker before your next upload. Free score preview. No account needed. Your file is either ready or it isn't — better to know now than after the rejection email.",
      },
    ],
  },
  {
    slug: "canva-to-kdp-export-failures",
    title: "Canva to KDP: Why Your PDF Keeps Getting Rejected (And How to Fix It)",
    excerpt:
      "Canva gets you 80% of the way there. Here's what's happening in the other 20% — and why it keeps getting your book rejected by Amazon KDP.",
    publishedAt: "2026-04-30",
    tags: ["kdp", "canva", "formatting", "rejection"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Let me save you about three weeks of your life.",
      },
      {
        type: "p",
        text: "When I started publishing on Amazon KDP, Canva was my best friend. Free. Beautiful templates. Drag and drop. What could go wrong? Everything. That's what could go wrong.",
      },
      {
        type: "p",
        text: "I used Canva for my first few books — journals, mostly — and I cannot tell you how many times I uploaded a file that looked absolutely perfect on screen and got rejected within days. Vague emails. Margins. Bleed. File issues. Again and again.",
      },
      {
        type: "p",
        text: "The problem isn't Canva. Canva is a great tool. The problem is that Canva was built for digital design and social media — and Amazon KDP prints physical books. Those two worlds have very different rules, and Canva doesn't warn you when you're about to cross a line.",
      },
      {
        type: "h2",
        text: "Problem 1: Your Page Size Is Wrong",
      },
      {
        type: "p",
        text: "KDP has specific trim sizes — 6×9, 5.5×8.5, 8.5×11 and so on. When you create a design in Canva, you pick a canvas size. If that canvas doesn't match your KDP trim size exactly — and I mean exactly, down to fractions of an inch — KDP rejects it. Canva's default A4 or US Letter templates? Not KDP trim sizes. Not even close for most books.",
      },
      {
        type: "p",
        text: "Fix: Before you start designing, set a custom page size in Canva that matches your KDP trim size exactly. Not close. Exact. Not sure which trim size to pick? Our free Spine Width Calculator (manu2print.com/spine-calculator) will help you figure out your dimensions based on your page count and paper type — before you design a single page.",
      },
      {
        type: "h2",
        text: "Problem 2: Bleed Is Either Missing or Set Up Wrong",
      },
      {
        type: "p",
        text: "Here's the one that got me most. Bleed. If any element in your design — a background colour, an image, anything — goes right to the edge of the page, KDP needs a 0.125 inch bleed area. That's extra space beyond the trim line so when the printer cuts the book, there's no white strip on the edge. Canva has a bleed setting. It's buried. Most people never turn it on.",
      },
      {
        type: "p",
        text: "Fix: In Canva, when you go to download as PDF Print, check the box that says Crop marks and bleed. Make sure your design elements actually extend into that bleed zone — not just to the edge of the canvas.",
      },
      {
        type: "h2",
        text: "Problem 3: Your Fonts Might Not Be Embedded",
      },
      {
        type: "p",
        text: "This one is sneaky because your PDF looks completely normal. The text renders perfectly on screen. But KDP still rejects it. KDP requires that every font used in your PDF is fully embedded — meaning the font data is baked into the file itself. Some Canva exports, particularly with certain free fonts, don't embed correctly.",
      },
      {
        type: "p",
        text: "Fix: Stick to common, well-supported fonts in Canva. When you export, always use PDF Print not PDF Standard. And when in doubt — check your file before you upload rather than after you get the rejection email. That's why I built the KDP PDF Checker at manu2print.com/kdp-pdf-checker. Upload your Canva PDF before it goes to Amazon and it'll tell you exactly what's wrong — fonts, bleed, margins, trim size — everything. Free score preview. No account needed.",
      },
      {
        type: "h2",
        text: "Problem 4: Margins Are Too Tight",
      },
      {
        type: "p",
        text: "Canva makes it very easy to put text close to the edge of the page. It looks fine on screen. On a printed and bound book, that text gets eaten by the spine or cut off at the edge. KDP requires a minimum 0.25 inch margin on all outer edges. The inside margin — the gutter — needs to be wider depending on your page count. A 300-page book needs more gutter space than a 100-page one because the binding pulls the pages inward. Most Canva users don't account for the gutter. I didn't either. Not at first.",
      },
      {
        type: "p",
        text: "Fix: Use our free Page Count Estimator at manu2print.com/page-count-estimator to get your estimated final page count before you set up your design, so you know exactly what gutter margin KDP requires. Set those margins in Canva before you design a single page — not after.",
      },
      {
        type: "h2",
        text: "Problem 5: RGB Colour Mode",
      },
      {
        type: "p",
        text: "Canva designs in RGB — which is perfect for screens, social media, websites. Amazon KDP prints in CMYK. The two colour systems are different, and what looks vivid on your monitor can print dull or shifted on paper. For black and white interior books this is less of an issue. For colour interiors and covers — it matters a lot.",
      },
      {
        type: "p",
        text: "Fix: For interior pages, export as a greyscale PDF if your book is black and white. For colour, know that there will be some colour shift from screen to print — it's unavoidable when going from Canva. Order a proof copy before you commit.",
      },
      {
        type: "h2",
        text: "The Honest Truth About Canva and KDP",
      },
      {
        type: "p",
        text: "Canva gets you 80% of the way there. It's fast, it looks good, and for a first-time author with no design budget, it's a lifesaver. But that last 20% — the technical stuff KDP actually checks — Canva doesn't handle for you. It doesn't warn you. It doesn't know you're going to print. It just exports what you built.",
      },
      {
        type: "p",
        text: "That gap is where most first-time authors lose weeks of their life to rejection cycles. I lost about three weeks myself before I understood what was actually going wrong. Before your next Canva upload, run your PDF through the KDP PDF Checker at manu2print.com/kdp-pdf-checker. It takes about 90 seconds and it'll catch everything in this list. The score preview is free. The full annotated report, which shows every issue by page number, is $9.",
      },
      {
        type: "p",
        text: "Your mom will still say it's wonderful. But this time, Amazon might agree.",
      },
    ],
  },
  {
    slug: "12-rejections-what-kdp-never-told-me",
    title: "12 Rejections. 10 Weeks. What Amazon KDP Never Told Me.",
    excerpt:
      "I spent 10 weeks building my first book for Amazon KDP. It was rejected 12 times. Here's the honest story — and why I built a tool to make sure it doesn't happen to you.",
    publishedAt: "2026-04-30",
    tags: ["kdp", "rejection", "founder-story", "indie-publishing"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Last year, after watching dozens of influencer videos spewing how easy it is to make money on Amazon KDP, I was compelled to give it a shot. I am 65. I live in a country where an aging white guy just won't get a job — no matter how ready, willing, and able. Out of desperation, I got into creating my first book.",
      },
      {
        type: "p",
        text: "Supposed to be easy. I got a Canva account — free one — opened up ChatGPT, bookmarked every influencer video I could find, and immersed myself in the work. All the time dreaming — well, hoping — this would be a way to earn an income.",
      },
      {
        type: "h2",
        text: "The Dream Phase",
      },
      {
        type: "p",
        text: "12 to 16 hour days for weeks on end until I finally had something I thought was brilliant. Ever the dreamer, right? My mom — 87 years old — said it was wonderful. My girlfriend said I was amazing. Friends reviewed it and told me how great it was. I was ready. My publishing empire was about to take off.",
      },
      {
        type: "p",
        text: "I pained over this for 10 weeks. Font changes, margins, image editing, rewrites, research. A quite funny crypto-related journal. My first ever asset. I set out to upload to the source of my incoming wealth — Amazon KDP.",
      },
      {
        type: "h2",
        text: "The Rejection",
      },
      {
        type: "p",
        text: "After probably a dozen upload attempts, I finally got it in. I sat back — quite proud of myself — and waited. Day one. Day two. Day three. Rejected. WTF? I did everything right. The email was vague. Margins. Bleed. TOC. And on and on.",
      },
      {
        type: "p",
        text: "13 times. Yes — 13 times I uploaded to Amazon KDP. 12 rejections before my asset was finally approved. I did two more journals after that. And yes — while I didn't have to repeat the full 12-rejection cycle, I still racked up several more for the same reasons. Margins. Bleed. Fonts. The same vague, unhelpful emails.",
      },
      {
        type: "h2",
        text: "What The Influencers Don't Tell You",
      },
      {
        type: "p",
        text: "I soon realised something about all those make-millions-on-KDP videos. These influencers had years of experience. They were making money from the courses they were selling and the ad revenue on their channels. Not from KDP royalties. My inbox was flooded with free trials and how-to guides. Join my course and become a book publishing titan of industry. Dream on.",
      },
      {
        type: "p",
        text: "The days became weeks. Months. Every little thing that didn't look right sent me back to YouTube. Scouring Facebook groups and Reddit forums. All I got was more confusion. 5 more books — formatting and editing for other people who had real stories to tell. All of them on Amazon. No sales. No marketing budget. Lost in the millions of dream attempts.",
      },
      {
        type: "p",
        text: "I was defeated by lack of sales and enriched by experience and knowledge. And I went back to the streets trying to find a job. Not one positive. Nothing. No one wants you when you're old.",
      },
      {
        type: "h2",
        text: "Why I Built This",
      },
      {
        type: "p",
        text: "About 8 months ago I came across vibe coding — building software with AI tools. And I thought: I know exactly what the pain points are for KDP authors. I lived them. What if I built something that takes the guessing out of whether a PDF manuscript will pass KDP's rules before you upload?",
      },
      {
        type: "p",
        text: "3 months. Over 15 hours a day, every day. I borrowed money to get the right infrastructure in place. The result is manu2print — a KDP PDF checker that tells you exactly what's wrong with your file before Amazon sees it. Margins. Trim size. Bleed. Fonts. The exact things that caused my 12 rejections, caught before they become your 12 rejections.",
      },
      {
        type: "p",
        text: "My mom thinks it's great. My girlfriend agrees. But I want to hear from the people in the trenches. If you've been rejected by KDP — or you're about to upload for the first time — try it. Tear it apart. Tell me what's missing. That feedback is worth more to me right now than any sale.",
      },
    ],
  },
  {
    slug: "why-kdp-rejects-your-pdf",
    title: "Why KDP Rejects Your PDF (and the 5 Most Common Causes)",
    excerpt:
      "Amazon's rejection emails are frustratingly vague. Here's what they actually mean — and how to fix each issue before you re-upload.",
    publishedAt: "2026-03-25",
    notified: true,
    tags: ["kdp", "formatting", "rejection"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Amazon KDP's rejection message is almost always the same: 'Your file does not meet our submission guidelines. Please review the KDP Formatting Guidelines and resubmit.' It tells you nothing specific — which means you're left guessing what went wrong.",
      },
      { type: "h2", text: "The 5 most common rejection causes" },
      {
        type: "ul",
        items: [
          "Trim size mismatch — your PDF page size doesn't match the trim size you selected in KDP",
          "Margin violations — text or images too close to the page edge; KDP requires 0.25\" on outer margins and 0.375\" (up to 0.75\") on the gutter",
          "Missing or incorrect bleed — if your cover or interior goes edge-to-edge, you need a 0.125\" bleed area on all sides",
          "Fonts not embedded — every font used in the PDF must be fully embedded; some free fonts and PDF exports skip this step",
          "Images too low-resolution — KDP recommends 300 DPI minimum for print; anything below 200 DPI will appear blurry",
        ],
      },
      {
        type: "p",
        text: "The worst part about these rejections is that Amazon doesn't tell you which page, which margin, or which font triggered the error. That's exactly why we built the KDP PDF Checker — it catches all of these issues by page number before you upload.",
      },
      { type: "h2", text: "How to find your specific issue" },
      {
        type: "p",
        text: "Upload your PDF to the KDP PDF Checker and you'll get a readiness score plus a count of issues. Pay $9 to unlock the full annotated report — every issue is shown by page number with a plain-English fix instruction. Most authors fix everything in under an hour.",
      },
    ],
  },
  {
    slug: "kdp-margin-requirements",
    title: "KDP Margin Requirements: A Complete Guide for 2025",
    excerpt:
      "The exact margin sizes KDP requires for interior manuscripts — and why getting them wrong is the #1 cause of rejection.",
    publishedAt: "2026-03-22",
    notified: true,
    tags: ["kdp", "margins", "formatting"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "Getting your margins wrong is the fastest way to have your manuscript rejected by KDP. Here are the exact requirements so you can set them up correctly the first time.",
      },
      { type: "h2", text: "Outside (top, bottom, and outer) margins" },
      {
        type: "p",
        text: "KDP requires a minimum of 0.25 inches (6.35mm) on all outside margins — top, bottom, and the outer edge. Most formatting guides recommend 0.5 inches to be safe and to look professional.",
      },
      { type: "h2", text: "Inside (gutter) margins" },
      {
        type: "ul",
        items: [
          "24–150 pages: 0.375 inch minimum",
          "151–400 pages: 0.75 inch minimum",
          "401–600 pages: 0.875 inch minimum",
          "601+ pages: 1 inch minimum",
        ],
      },
      {
        type: "p",
        text: "The gutter is the inside edge that binds — the longer your book, the more pages flex when opened, so KDP requires larger gutters to keep text legible near the spine.",
      },
      { type: "h2", text: "Safe zone vs. bleed" },
      {
        type: "p",
        text: "The safe zone is 0.25 inches from every edge — keep all critical text and images inside this boundary. If any element extends to the very edge of the page (like a background image), you need to add a 0.125 inch bleed on all four sides and use a larger page size in your PDF.",
      },
      {
        type: "p",
        text: "The KDP PDF Checker checks all margin requirements against your actual file — including per-page violations. If your chapter header is 0.2 inches from the edge on page 47, it will find it.",
      },
    ],
  },
];

export function getAllPosts(): BlogPost[] {
  const today = new Date().toISOString().slice(0, 10);
  return [...POSTS]
    .filter((p) => p.publishedAt <= today)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  return POSTS.find((p) => p.slug === slug) ?? null;
}

export function getAllBlogTags(): string[] {
  const tags = new Set<string>();
  for (const post of POSTS) {
    for (const tag of post.tags ?? []) tags.add(tag);
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  const tagSet = new Set(post.tags ?? []);
  return getAllPosts()
    .filter((p) => p.slug !== slug)
    .map((p) => ({
      post: p,
      score: (p.tags ?? []).reduce((n, t) => n + (tagSet.has(t) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score || new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime())
    .slice(0, limit)
    .map((x) => x.post);
}

