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

