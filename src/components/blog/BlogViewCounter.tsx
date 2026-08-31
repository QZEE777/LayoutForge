"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

/** Re-count a view from the same browser at most once per day. */
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

function dedupeKey(slug: string): string {
  return `m2p_blog_view_${slug}`;
}

export default function BlogViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const key = dedupeKey(slug);
    const lastViewed = Number(localStorage.getItem(key) ?? 0);
    const alreadyCountedToday = Date.now() - lastViewed < DEDUPE_WINDOW_MS;

    const request = alreadyCountedToday
      ? fetch(`/api/blog/view?slug=${encodeURIComponent(slug)}`).then((r) => r.json())
      : fetch("/api/blog/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        }).then((r) => r.json());

    request
      .then((data: { views?: number }) => {
        if (cancelled) return;
        if (typeof data.views === "number") setViews(data.views);
        if (!alreadyCountedToday) localStorage.setItem(key, String(Date.now()));
      })
      .catch(() => {
        /* view counter is non-critical — fail silently */
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (views === null) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-m2p-muted">
      <Eye className="w-3.5 h-3.5" />
      {views.toLocaleString()} {views === 1 ? "read" : "reads"}
    </span>
  );
}
