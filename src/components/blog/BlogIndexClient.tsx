"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog";

type Props = {
  posts: BlogPost[];
  allTags: string[];
};

const AFFILIATE_PICKS = [
  { label: "Canva Pro (covers & interiors)", href: "#" },
  { label: "Atticus (book formatting)", href: "#" },
  { label: "Publisher Rocket (keywords)", href: "#" },
];

export default function BlogIndexClient({ posts, allTags }: Props) {
  const [activeTag, setActiveTag] = useState<string>("all");
  const [activeType, setActiveType] = useState<"all" | "article" | "video" | "hybrid">("all");

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const tagOk = activeTag === "all" || (p.tags ?? []).includes(activeTag);
      const type = p.contentType ?? "article";
      const typeOk = activeType === "all" || type === activeType;
      return tagOk && typeOk;
    });
  }, [posts, activeTag, activeType]);

  const featured = filtered[0] ?? null;
  const list = filtered.slice(1);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="font-bebas text-4xl tracking-wide text-m2p-ink">Blog</h1>
        <p className="mt-2 text-m2p-muted">
          Product updates, KDP notes, and what we&apos;re shipping next.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Type</span>
        {(["all", "article", "video", "hybrid"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveType(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
              activeType === t
                ? "border-m2p-orange bg-m2p-orange-soft text-m2p-ink"
                : "border-m2p-border bg-white text-m2p-muted hover:border-m2p-orange/40"
            }`}
          >
            {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Topics</span>
        <button
          type="button"
          onClick={() => setActiveTag("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
            activeTag === "all"
              ? "border-m2p-orange bg-m2p-orange-soft text-m2p-ink"
              : "border-m2p-border bg-white text-m2p-muted hover:border-m2p-orange/40"
          }`}
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
              activeTag === tag
                ? "border-m2p-orange bg-m2p-orange-soft text-m2p-ink"
                : "border-m2p-border bg-white text-m2p-muted hover:border-m2p-orange/40"
            }`}
          >
            #{tag}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {featured ? (
            <Link
              href={`/blog/${featured.slug}`}
              className="mb-6 block rounded-2xl border border-m2p-border bg-white p-6 transition hover:border-m2p-orange/40 hover:shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-m2p-orange">Featured</p>
              <h2 className="mt-2 text-2xl font-semibold text-m2p-ink">{featured.title}</h2>
              <p className="mt-2 text-m2p-muted">{featured.excerpt}</p>
              <p className="mt-3 text-xs text-m2p-muted">
                {new Date(featured.publishedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                {" · "}
                {(featured.contentType ?? "article").toUpperCase()}
              </p>
            </Link>
          ) : (
            <div className="mb-6 rounded-2xl border border-m2p-border bg-white p-6 text-sm text-m2p-muted">
              No posts match this filter yet.
            </div>
          )}

          <div className="grid gap-4">
            {list.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border border-m2p-border bg-white p-5 transition hover:border-m2p-orange/40 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-m2p-ink">{post.title}</h3>
                  <time className="text-xs text-m2p-muted" dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </time>
                </div>
                <p className="mt-2 text-sm text-m2p-muted">{post.excerpt}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-m2p-border bg-m2p-orange-soft px-2.5 py-0.5 text-[11px] font-medium text-m2p-ink">
                    {(post.contentType ?? "article").toUpperCase()}
                  </span>
                  {(post.tags ?? []).slice(0, 3).map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full border border-m2p-border px-2.5 py-0.5 text-[11px] font-medium text-m2p-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-m2p-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Start Here</p>
            <p className="mt-2 text-sm text-m2p-muted">
              New to KDP formatting? Start with margin rules, then run a PDF check before upload.
            </p>
            <Link href="/kdp-pdf-checker" className="mt-3 inline-block text-sm font-semibold text-m2p-orange hover:underline">
              Check your PDF →
            </Link>
          </div>

          <div className="rounded-2xl border border-m2p-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Creator Affiliate Picks</p>
            <ul className="mt-2 space-y-2">
              {AFFILIATE_PICKS.map((pick) => (
                <li key={pick.label}>
                  <a href={pick.href} className="text-sm text-m2p-ink hover:text-m2p-orange">
                    {pick.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-m2p-muted">
              Disclosure: Some recommendations may become affiliate links. We only promote tools we trust.
            </p>
          </div>

          <div className="rounded-2xl border border-m2p-border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Video + Social</p>
            <p className="mt-2 text-sm text-m2p-muted">
              Video-first posts are supported. New posts are prepared for LinkedIn, Facebook, and Instagram distribution.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
