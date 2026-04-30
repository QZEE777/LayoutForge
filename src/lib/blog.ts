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
  return [...POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
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

