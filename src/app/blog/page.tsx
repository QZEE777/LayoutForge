import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog — manu2print",
  description: "Updates, guides, and release notes for manu2print and KDP tools.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <h1 className="font-bebas text-4xl tracking-wide text-m2p-ink">Blog</h1>
          <p className="mt-2 text-m2p-muted">
            Product updates, KDP notes, and what we’re shipping next.
          </p>
        </div>

        <div className="grid gap-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-m2p-border bg-white p-6 hover:border-m2p-orange/40 hover:shadow-sm transition"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold text-m2p-ink">{post.title}</h2>
                <time className="text-sm text-m2p-muted" dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              <p className="mt-2 text-m2p-muted">{post.excerpt}</p>
              {post.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
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
            </Link>
          ))}
        </div>
      </div>
    </SiteShell>
  );
}

