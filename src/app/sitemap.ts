import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

const BASE = "https://www.manu2print.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Core ──────────────────────────────────────────────────────────────────
    {
      url: `${BASE}/`,
      lastModified: new Date("2026-04-29"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/kdp-pdf-checker`,
      lastModified: new Date("2026-04-29"),
      changeFrequency: "weekly",
      priority: 0.95,
    },

    // ── Free tools ────────────────────────────────────────────────────────────
    {
      url: `${BASE}/spine-calculator`,
      lastModified: new Date("2026-04-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/royalty-calculator`,
      lastModified: new Date("2026-04-01"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/page-count-estimator`,
      lastModified: new Date("2026-04-01"),
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${BASE}/title-metadata-check`,
      lastModified: new Date("2026-04-29"),
      changeFrequency: "monthly",
      priority: 0.6,
    },

    // ── Blog ──────────────────────────────────────────────────────────────────
    {
      url: `${BASE}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...getAllPosts().map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),

    // ── Legal ─────────────────────────────────────────────────────────────────
    {
      url: `${BASE}/privacy`,
      lastModified: new Date("2026-04-24"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date("2026-04-06"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/refunds`,
      lastModified: new Date("2026-04-06"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/cookies`,
      lastModified: new Date("2026-04-24"),
      changeFrequency: "yearly",
      priority: 0.2,
    },

  ];
}
