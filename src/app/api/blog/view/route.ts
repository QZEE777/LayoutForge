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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("increment_blog_view", { post_slug: slug });
    if (error) {
      console.error("[blog/view] Supabase error:", error);
      return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
    }
    return NextResponse.json({ views: data as number });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
