import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PRIMARY_PLATFORMS = ["YouTube", "TikTok", "Instagram", "Facebook", "Blog or Website", "Podcast", "Other"];
const FOLLOWER_COUNTS = ["1,000–5,000", "5,000–25,000", "25,000–100,000", "100,000+"];
const PUBLISHING_OPTIONS = [
  "Amazon KDP", "IngramSpark", "Draft2Digital", "Etsy", "Gumroad", "Lulu",
  "Barnes & Noble Press", "Kobo", "Smashwords", "PublishDrive", "Other",
];

function isValidPrimaryPlatform(v: string) {
  return PRIMARY_PLATFORMS.includes(v);
}
function isValidFollowerCount(v: string) {
  return FOLLOWER_COUNTS.includes(v);
}
function isValidPublishingPlatforms(arr: unknown): arr is string[] {
  if (!Array.isArray(arr)) return false;
  return arr.every((item) => typeof item === "string" && PUBLISHING_OPTIONS.includes(item));
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();

    const fullName = typeof body?.full_name === "string" ? body.full_name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const primaryPlatform = typeof body?.primary_platform === "string" ? body.primary_platform : "";
    const platformUrl = typeof body?.platform_url === "string" ? body.platform_url.trim() : "";
    const followerCount = typeof body?.follower_count === "string" ? body.follower_count : "";
    const publishingPlatforms = body?.publishing_platforms;
    const audienceDescription = typeof body?.audience_description === "string" ? body.audience_description.trim() : "";

    if (!fullName) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!isValidPrimaryPlatform(primaryPlatform)) {
      return NextResponse.json({ error: "Valid primary platform is required" }, { status: 400 });
    }
    if (!platformUrl) {
      return NextResponse.json({ error: "Platform URL or handle is required" }, { status: 400 });
    }
    if (!isValidFollowerCount(followerCount)) {
      return NextResponse.json({ error: "Valid follower count is required" }, { status: 400 });
    }
    if (!isValidPublishingPlatforms(publishingPlatforms) || publishingPlatforms.length === 0) {
      return NextResponse.json({ error: "Select at least one publishing platform" }, { status: 400 });
    }
    if (!audienceDescription) {
      return NextResponse.json({ error: "Audience description is required" }, { status: 400 });
    }
    if (audienceDescription.length > 300) {
      return NextResponse.json({ error: "Audience description must be 300 characters or less" }, { status: 400 });
    }

    const { error } = await supabase
      .from("founder_applications")
      .insert({
        full_name: fullName,
        email,
        primary_platform: primaryPlatform,
        platform_url: platformUrl,
        follower_count: followerCount,
        publishing_platforms: publishingPlatforms,
        audience_description: audienceDescription,
      });

    if (error) {
      console.error("[founder-applications] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
