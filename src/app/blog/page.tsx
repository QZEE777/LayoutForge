import BlogShell from "@/components/blog/BlogShell";
import { getAllBlogTags, getAllPosts } from "@/lib/blog";
import BlogIndexClient from "@/components/blog/BlogIndexClient";

export const metadata = {
  title: "Blog — manu2print",
  description: "Updates, guides, and release notes for manu2print and KDP tools.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const allTags = getAllBlogTags();

  return (
    <BlogShell>
      <BlogIndexClient posts={posts} allTags={allTags} />
    </BlogShell>
  );
}

