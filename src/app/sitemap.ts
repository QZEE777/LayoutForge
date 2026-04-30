import type { MetadataRoute } from "next";

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
    {
      url: `${BASE}/blog/12-rejections-what-kdp-never-told-me`,
      lastModified: new Date("2026-04-30"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/canva-to-kdp-export-failures`,
      lastModified: new Date("2026-04-30"),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE}/blog/why-kdp-rejects-your-pdf`,
      lastModified: new Date("2026-03-25"),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${BASE}/blog/kdp-margin-requirements`,
      lastModified: new Date("2026-03-22"),
      changeFrequency: "monthly",
      priority: 0.65,
    },

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

    // ── Account / utility ─────────────────────────────────────────────────────
    {
      url: `${BASE}/resend-link`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/my-orders`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
