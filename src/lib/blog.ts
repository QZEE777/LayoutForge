export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string; // ISO date string
  tags?: string[];
  content: Array<
    | { type: "p"; text: string }
    | { type: "h2"; text: string }
    | { type: "ul"; items: string[] }
  >;
};

const POSTS: BlogPost[] = [
  {
    slug: "welcome",
    title: "Welcome to manu2print",
    excerpt:
      "What we’re building, who it’s for, and how we think about shipping safe tools for KDP authors.",
    publishedAt: "2026-03-18",
    tags: ["launch", "kdp"],
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

