import type { MetadataRoute } from "next";

const BASE = "https://www.manu2print.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/kdp-pdf-checker`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${BASE}/partners`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/partners/apply`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
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
    {
      url: `${BASE}/blog/welcome`,
      lastModified: new Date("2026-03-18"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
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
