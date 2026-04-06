import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRateLimit } from "@/lib/rateLimitAdmin";
import { requireAdminPermission } from "@/lib/adminAccess";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  const auth = requireAdminPermission(request, "admin.founder_giveaways.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("founder_giveaway_campaigns")
    .select("id, founder_user_id, name, code, max_redemptions, status, expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Failed to load campaigns" }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  const auth = requireAdminPermission(request, "admin.founder_giveaways.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const founderUserId = typeof body?.founderUserId === "string" ? body.founderUserId.trim() : null;
  const maxRedemptions = Number(body?.maxRedemptions);
  const expiresAt = typeof body?.expiresAt === "string" ? body.expiresAt : null;

  if (!name || !code || !Number.isInteger(maxRedemptions) || maxRedemptions <= 0) {
    return NextResponse.json({ error: "name, code and maxRedemptions are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("founder_giveaway_campaigns")
    .insert({
      founder_user_id: founderUserId,
      name,
      code,
      max_redemptions: maxRedemptions,
      expires_at: expiresAt,
    })
    .select("id, name, code, max_redemptions, status, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, campaign: data });
}
