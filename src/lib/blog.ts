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
  {
    slug: "welcome",
    title: "Welcome to manu2print",
    excerpt:
      "What we’re building, who it’s for, and how we think about shipping safe tools for KDP authors.",
    publishedAt: "2026-03-18",
    notified: true,
    tags: ["launch", "kdp"],
    contentType: "article",
    content: [
      {
        type: "p",
        text: "manu2print exists to help indie authors ship cleaner, KDP-ready files with less stress. We focus on practical tools: checking PDFs, generating compliant layouts, and keeping the workflow simple.",
      },
      { type: "h2", text: "Our philosophy" },
      {
        type: "ul",
        items: [
          "Ship live features end-to-end (not “local-only”).",
          "Security-first: no secrets in code, no unnecessary file retention.",
          "Cost-aware: free tools stay client-side; paid flows use server resources when needed.",
        ],
      },
      {
        type: "p",
        text: "If you have a manuscript that’s failing KDP checks (trim, margins, bleed), start with Print Ready Check, then use the formatter flows where appropriate.",
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

