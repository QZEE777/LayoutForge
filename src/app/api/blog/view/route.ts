import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim() ?? "";
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("blog_post_views")
    .select("view_count")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[blog/view] Supabase error:", error);
    return NextResponse.json({ error: "Failed to read views" }, { status: 500 });
  }
  return NextResponse.json({ views: data?.view_count ?? 0 });
}

const SLUG_RE = /^[a-z0-9-]{1,120}$/;
const SEEN_COOKIE_MAX_AGE = 60 * 60 * 24; // count one view per browser per post per day

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    if (!SLUG_RE.test(slug)) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const seenCookie = `bv_${slug}`;
    const alreadySeen = request.headers
      .get("cookie")
      ?.split(";")
      .some((c) => c.trim().startsWith(`${seenCookie}=`));

    if (alreadySeen) {
      const { data, error } = await supabase
        .from("blog_post_views")
        .select("view_count")
        .eq("slug", slug)
        .maybeSingle();
      if (error) {
        console.error("[blog/view] Supabase error:", error);
        return NextResponse.json({ error: "Failed to read views" }, { status: 500 });
      }
      return NextResponse.json({ views: data?.view_count ?? 0 });
    }

    const { data, error } = await supabase.rpc("increment_blog_view", { post_slug: slug });
    if (error) {
      console.error("[blog/view] Supabase error:", error);
      return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
    }
    const res = NextResponse.json({ views: data as number });
    res.cookies.set(seenCookie, "1", {
      maxAge: SEEN_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
