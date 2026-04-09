"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BlogPost } from "@/lib/blog";
import Image from "next/image";

type Props = {
  posts: BlogPost[];
  allTags: string[];
};

const AFFILIATE_PICKS = [
  { label: "Canva Pro (covers & interiors)", href: "#" },
  { label: "Atticus (book formatting)", href: "#" },
  { label: "Publisher Rocket (keywords)", href: "#" },
];

const TAG_STYLE: Record<string, { chip: string; bar: string }> = {
  kdp: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "from-emerald-400 to-emerald-600" },
  formatting: { chip: "bg-orange-50 text-orange-700 border-orange-200", bar: "from-orange-400 to-orange-600" },
  rejection: { chip: "bg-rose-50 text-rose-700 border-rose-200", bar: "from-rose-400 to-rose-600" },
  margins: { chip: "bg-sky-50 text-sky-700 border-sky-200", bar: "from-sky-400 to-sky-600" },
  launch: { chip: "bg-violet-50 text-violet-700 border-violet-200", bar: "from-violet-400 to-violet-600" },
};

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
  const readTime = (text: string) => `${Math.max(2, Math.round(text.split(" ").length / 140))} min read`;
  const primaryTag = (post: BlogPost) => (post.tags?.[0] ?? "kdp").toLowerCase();
  const chipClassFor = (tag: string) => TAG_STYLE[tag]?.chip ?? "bg-m2p-orange-soft text-m2p-ink border-m2p-border";
  const barClassFor = (tag: string) => TAG_STYLE[tag]?.bar ?? "from-[#ff7a4a] to-[#f05a28]";

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Blog hero — CSS-only, no image dependency */}
      <div className="mb-8 relative overflow-hidden rounded-2xl shadow-[0_24px_56px_-30px_rgba(26,18,8,0.7)]"
        style={{ background: "linear-gradient(135deg, #1A1208 0%, #23170B 55%, #2A1B0D 100%)" }}
      >
        {/* Orange glow — top left */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 55% 70% at 22% 25%, rgba(240,90,40,0.42) 0%, transparent 100%)",
        }} />
        {/* Green glow — top right */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 50% 65% at 80% 30%, rgba(76,217,100,0.30) 0%, transparent 100%)",
        }} />
        {/* Subtle horizontal rule lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 49px, rgba(255,255,255,0.06) 49px, rgba(255,255,255,0.06) 50px)",
        }} />
        {/* Content */}
        <div className="relative px-8 py-12 sm:px-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(250,247,238,0.40)" }}>
            M2P · Editorial Desk
          </p>
          <h1 className="mt-3 font-bebas text-5xl tracking-wide sm:text-6xl" style={{ color: "#FAF7EE" }}>
            KDP notes that ship
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed sm:text-lg" style={{ color: "rgba(240,223,209,0.72)" }}>
            Clarity, proof, and practical next steps — straight from the build.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-m2p-border bg-white/90 p-3 shadow-[0_8px_26px_-20px_rgba(26,18,8,0.4)]">
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

      <div className="mb-8 flex flex-wrap items-center gap-2 rounded-2xl border border-m2p-border bg-white/90 p-3 shadow-[0_8px_26px_-20px_rgba(26,18,8,0.4)]">
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
              className="m2p-card-lift mb-6 block overflow-hidden rounded-3xl border border-m2p-border bg-white transition hover:border-m2p-orange/40 hover:shadow-[0_28px_58px_-30px_rgba(240,90,40,0.45)]"
            >
              <div className="relative h-56 overflow-hidden border-b border-m2p-border">
                <Image
                  src="/blog-hero-placeholder.svg"
                  alt="Featured blog visual"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
                <div className="absolute left-4 top-4">
                  <p className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-m2p-orange">
                    Featured
                  </p>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs font-semibold tracking-wide text-white/90">
                    {(featured.contentType ?? "article").toUpperCase()} · {readTime(featured.excerpt)}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold leading-tight text-white">{featured.title}</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-m2p-muted">{featured.excerpt}</p>
                {(featured.tags?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {featured.tags!.slice(0, 3).map((t) => (
                      <span key={t} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${chipClassFor(t.toLowerCase())}`}>
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-m2p-muted">
                  {new Date(featured.publishedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ) : (
            <div className="mb-6 rounded-2xl border border-m2p-border bg-white p-6 text-sm text-m2p-muted">
              No posts match this filter yet.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {list.map((post, idx) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className={`m2p-card-lift block rounded-2xl border border-m2p-border bg-white p-5 transition hover:border-m2p-orange/40 hover:shadow-[0_20px_45px_-30px_rgba(26,18,8,0.28)] ${
                  idx % 5 === 0 ? "sm:col-span-2" : ""
                }`}
              >
                <div className={`mb-3 h-1.5 w-20 rounded-full bg-gradient-to-r ${barClassFor(primaryTag(post))}`} />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-semibold text-m2p-ink">{post.title}</h3>
                  <time className="text-xs text-m2p-muted" dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </time>
                </div>
                <p className="mt-2 text-sm text-m2p-muted">{post.excerpt}</p>
                <p className="mt-2 text-[11px] font-medium text-m2p-muted">{readTime(post.excerpt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-m2p-border bg-m2p-orange-soft px-2.5 py-0.5 text-[11px] font-medium text-m2p-ink">
                    {(post.contentType ?? "article").toUpperCase()}
                  </span>
                  {(post.tags ?? []).slice(0, 3).map((t) => (
                    <span key={t} className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${chipClassFor(t.toLowerCase())}`}>
                      #{t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="m2p-glass rounded-2xl border border-m2p-border bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(26,18,8,0.35)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Start Here</p>
            <p className="mt-2 text-sm text-m2p-muted">
              New to KDP formatting? Start with margin rules, then run a PDF check before upload.
            </p>
            <Link href="/kdp-pdf-checker" className="mt-3 inline-block text-sm font-semibold text-m2p-orange hover:underline">
              Check your PDF →
            </Link>
          </div>

          <div className="m2p-glass rounded-2xl border border-m2p-border bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(26,18,8,0.35)] backdrop-blur-sm">
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

          <div className="m2p-glass rounded-2xl border border-m2p-border bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(26,18,8,0.35)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Video + Social</p>
            <p className="mt-2 text-sm text-m2p-muted">
              Video-first posts are supported. New posts are prepared for LinkedIn, Facebook, and Instagram distribution.
            </p>
          </div>
          <div className="m2p-glass rounded-2xl border border-m2p-border bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(26,18,8,0.35)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Join the desk</p>
            <p className="mt-2 text-sm text-m2p-muted">
              Get one practical KDP fix per week.
            </p>
            <a href="mailto:hello@manu2print.com?subject=Blog%20updates" className="mt-3 inline-block text-sm font-semibold text-m2p-orange hover:underline">
              Subscribe via email →
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
