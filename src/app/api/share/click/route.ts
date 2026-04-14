import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";

const SALT = process.env.HASH_SALT ?? "m2p_default_salt_change_in_prod";

function hashValue(value: string): string {
  return "v1_" + crypto.createHmac("sha256", SALT).update(value).digest("hex");
}

// POST — record a share link click for attribution tracking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const sourcePage = typeof body?.source_page === "string" ? body.source_page : "";

    if (!token || !token.startsWith("sh_") || token.length > 22) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify token exists and is active
    const { data: shareToken } = await service
      .from("share_tokens")
      .select("id, token_status")
      .eq("token", token)
      .maybeSingle();

    if (!shareToken || shareToken.token_status !== "active") {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    // Rate limit: 100 clicks per token per IP per 24h
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const ipHash = ip ? hashValue(ip) : "";
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (ipHash) {
      const { count } = await service
        .from("share_clicks")
        .select("click_id", { count: "exact", head: true })
        .eq("token", token)
        .eq("ip_hash", ipHash)
        .gte("clicked_at", since);

      if ((count ?? 0) >= 100) {
        return NextResponse.json({ ok: true, rate_limited: true });
      }
    }

    // Build device fingerprint from headers
    const ua = req.headers.get("user-agent") ?? "";
    const lang = req.headers.get("accept-language") ?? "";
    const enc = req.headers.get("accept-encoding") ?? "";
    const deviceFingerprint = ua + "|" + lang + "|" + enc;
    const deviceHash = hashValue(deviceFingerprint);
    const uaHash = ua ? hashValue(ua) : "";
    const referer = req.headers.get("referer") ?? "";
    const refererHash = referer ? hashValue(referer) : "";

    // Basic fraud score at click time
    let fraudScore = 0;
    const fraudFlags: string[] = [];

    // Check if same device has hit 3+ different tokens in 30 days (multi-token abuse)
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: deviceClicks } = await service
      .from("share_clicks")
      .select("token")
      .eq("device_fingerprint_hash", deviceHash)
      .gte("clicked_at", since30d);

    const uniqueTokensFromDevice = new Set((deviceClicks ?? []).map((c) => c.token));
    if (uniqueTokensFromDevice.size >= 3) {
      fraudScore += 20;
      fraudFlags.push("multi_token_device");
    }

    // Insert click record
    await service.from("share_clicks").insert({
      token,
      ip_hash:                 ipHash,
      device_fingerprint_hash: deviceHash,
      user_agent_hash:         uaHash,
      referer_hash:            refererHash,
      source_page:             sourcePage,
      fraud_score:             fraudScore,
      fraud_flags:             fraudFlags,
    });

    // Update last_click_at and total_clicks on token
    await service
      .from("share_tokens")
      .update({
        last_click_at: new Date().toISOString(),
      })
      .eq("token", token);

    // Increment click counter via RPC (avoids race conditions)
    // Best effort — RPC created in migration; silently skipped if unavailable
    try {
      await service.rpc("increment_share_clicks", { p_token: token });
    } catch { /* best effort */ }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
