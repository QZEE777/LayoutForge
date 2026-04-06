import Link from "next/link";
import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Blog — manu2print" };
  return {
    title: `${post.title} — manu2print`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const related = getRelatedPosts(slug, 3);
  const readTime = `${Math.max(2, Math.round(post.content.map((b) => ("text" in b ? b.text : b.items.join(" "))).join(" ").split(" ").length / 150))} min read`;

  return (
    <SiteShell>
      <article className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href="/blog"
          className="text-sm text-m2p-muted hover:text-m2p-orange transition-colors"
        >
          ← Back to blog
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <header className="m2p-shimmer rounded-3xl border border-m2p-border bg-white p-6 shadow-[0_24px_52px_-34px_rgba(26,18,8,0.35)]">
              <h1 className="font-bebas text-4xl tracking-wide text-m2p-ink">
                {post.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <time className="text-sm text-m2p-muted" dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span className="inline-flex items-center rounded-full bg-m2p-orange-soft border border-m2p-border px-2.5 py-0.5 text-xs font-medium text-m2p-ink">
                  {(post.contentType ?? "article").toUpperCase()}
                </span>
                <span className="inline-flex items-center rounded-full bg-white border border-m2p-border px-2.5 py-0.5 text-xs font-medium text-m2p-muted">
                  {readTime}
                </span>
                {post.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-white border border-m2p-border px-2.5 py-0.5 text-xs font-medium text-m2p-muted"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </header>

            {post.videoUrl && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-m2p-border bg-white p-2">
                <div className="aspect-video w-full overflow-hidden rounded-xl">
                  <iframe
                    src={post.videoUrl}
                    title={post.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                {post.videoCaption && (
                  <p className="px-2 pb-1 pt-3 text-xs text-m2p-muted">{post.videoCaption}</p>
                )}
              </div>
            )}

            <div className="mt-8 space-y-5 rounded-3xl border border-m2p-border bg-white p-6 shadow-[0_24px_52px_-34px_rgba(26,18,8,0.3)]">
              {post.content.map((block, idx) => {
                if (block.type === "h2") {
                  return (
                    <h2 key={idx} className="text-2xl font-semibold text-m2p-ink">
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "ul") {
                  return (
                    <ul key={idx} className="list-disc pl-6 text-m2p-ink">
                      {block.items.map((it) => (
                        <li key={it} className="text-m2p-ink">
                          {it}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={idx} className="text-m2p-ink leading-relaxed">
                    {block.text}
                  </p>
                );
              })}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="m2p-glass rounded-2xl border border-m2p-border bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(26,18,8,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Next action</p>
              <p className="mt-2 text-sm text-m2p-muted">
                Run a checker scan before your next upload and fix issues page-by-page.
              </p>
              <Link href="/kdp-pdf-checker" className="mt-3 inline-block text-sm font-semibold text-m2p-orange hover:underline">
                Check your PDF →
              </Link>
            </div>

            {related.length > 0 && (
              <div className="m2p-glass rounded-2xl border border-m2p-border bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(26,18,8,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Related posts</p>
                <div className="mt-2 space-y-2">
                  {related.map((r) => (
                    <Link key={r.slug} href={`/blog/${r.slug}`} className="block text-sm text-m2p-ink hover:text-m2p-orange">
                      {r.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="m2p-glass rounded-2xl border border-m2p-border bg-white/95 p-4 shadow-[0_18px_36px_-28px_rgba(26,18,8,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-wide text-m2p-muted">Affiliate note</p>
              <p className="mt-2 text-[11px] leading-relaxed text-m2p-muted">
                Some tool recommendations on this blog may contain affiliate links. We only recommend tools that are relevant to KDP authors.
              </p>
            </div>
          </aside>
        </div>
      </article>
    </SiteShell>
  );
}

