import Link from "next/link";
import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

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

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-6 py-12">
        <Link
          href="/blog"
          className="text-sm text-m2p-muted hover:text-m2p-orange transition-colors"
        >
          ← Back to blog
        </Link>

        <header className="mt-6">
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
            {post.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-m2p-orange-soft border border-m2p-border px-2.5 py-0.5 text-xs font-medium text-m2p-ink"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <div className="mt-8 space-y-5">
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
      </article>
    </SiteShell>
  );
}

