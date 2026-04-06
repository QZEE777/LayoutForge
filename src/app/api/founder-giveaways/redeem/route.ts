import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const emailInput = typeof body?.email === "string" ? body.email : "";
  const email = normalizeEmail(emailInput);

  if (!code || !email || !email.includes("@")) {
    return NextResponse.json({ error: "code and email are required" }, { status: 400 });
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("founder_giveaway_campaigns")
    .select("id, max_redemptions, status, expires_at")
    .eq("code", code)
    .maybeSingle();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: "Invalid giveaway code" }, { status: 404 });
  }

  if (campaign.status !== "active") {
    return NextResponse.json({ error: "This giveaway is not active" }, { status: 400 });
  }
  if (campaign.expires_at && new Date(campaign.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This giveaway has expired" }, { status: 400 });
  }

  const { count: redemptionCount } = await supabase
    .from("founder_giveaway_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaign.id)
    .in("status", ["reserved", "fulfilled"]);

  if ((redemptionCount ?? 0) >= campaign.max_redemptions) {
    return NextResponse.json({ error: "This giveaway is fully redeemed" }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("founder_giveaway_redemptions")
    .insert({
      campaign_id: campaign.id,
      redeemer_email: email,
      status: "reserved",
    });

  if (insertError) {
    // Unique constraint from migration means this email already redeemed this code
    return NextResponse.json({ error: "You already redeemed this giveaway code" }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    message: "Giveaway code applied. Your free scan credit will be fulfilled shortly.",
  });
}
