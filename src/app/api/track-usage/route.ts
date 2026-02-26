import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabase as supabaseAdmin } from "@/lib/supabase";

const PAYWALL_ACTIVE = process.env.PAYWALL_ACTIVE === "true";
const FREE_LIMIT = 10;

type Profile = {
  id: string;
  email: string;
  usage_count: number;
  is_founder: boolean;
};

async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, usage_count, is_founder")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const usesRemaining = profile.is_founder
    ? null
    : Math.max(0, FREE_LIMIT - profile.usage_count);

  return NextResponse.json({
    usage_count: profile.usage_count,
    is_founder: profile.is_founder,
    uses_remaining: usesRemaining,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { tool?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400 }
    );
  }
  const tool = typeof body?.tool === "string" ? body.tool : "unknown";

  const profile = await getProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }

  const atLimit =
    !profile.is_founder &&
    PAYWALL_ACTIVE &&
    profile.usage_count >= FREE_LIMIT;
  if (atLimit) {
    return NextResponse.json(
      { error: "usage_limit_reached" },
      { status: 403 }
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ usage_count: profile.usage_count + 1 })
    .eq("id", user.id);
  if (updateError) {
    return NextResponse.json(
      { error: "update_failed" },
      { status: 500 }
    );
  }

  await supabaseAdmin.from("usage_events").insert({
    user_id: user.id,
    tool,
    ip_address: ip,
  });

  const newCount = profile.usage_count + 1;
  const usesRemaining = profile.is_founder
    ? null
    : Math.max(0, FREE_LIMIT - newCount);

  return NextResponse.json({
    success: true,
    usage_count: newCount,
    is_founder: profile.is_founder,
    uses_remaining: usesRemaining,
  });
}
