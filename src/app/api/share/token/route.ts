import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";

// ─── Token generation ─────────────────────────────────────────────────────────
// Format: sh_[16 cryptographic random chars] — 19 chars total, <100 byte cookie
function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(16);
  let token = "sh_";
  for (const b of bytes) {
    token += chars[b % chars.length];
  }
  return token;
}

// ─── GET — fetch existing token for authenticated user ────────────────────────
export async function GET() {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.email) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await service
    .from("share_tokens")
    .select("token, canonical_ref_id, total_conversions, total_conversions_pending")
    .eq("user_id", user.id)
    .eq("token_status", "active")
    .maybeSingle();

  return NextResponse.json({ token: existing ?? null });
}

// ─── POST — get or create token for authenticated user ────────────────────────
export async function POST() {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Return existing active token if present (canonical_ref_id is immutable)
  const { data: existing } = await service
    .from("share_tokens")
    .select("token, canonical_ref_id, total_conversions, total_conversions_pending")
    .eq("user_id", user.id)
    .eq("token_status", "active")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ token: existing });
  }

  // Rate limit: max 3 generation attempts per user per 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await service
    .from("share_tokens")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: "Rate limit: max 3 tokens per 24h" }, { status: 429 });
  }

  // Generate unique token with collision retry
  let token = "";
  let attempts = 0;
  while (attempts < 5) {
    const candidate = generateShareToken();
    const { data: collision } = await service
      .from("share_tokens")
      .select("id")
      .eq("token", candidate)
      .maybeSingle();
    if (!collision) { token = candidate; break; }
    attempts++;
  }
  if (!token) {
    return NextResponse.json({ error: "Token generation failed" }, { status: 500 });
  }

  const canonicalRefId = crypto.randomUUID();

  const { data: created, error: insertError } = await service
    .from("share_tokens")
    .insert({
      user_id:                  user.id,
      email:                    user.email.toLowerCase(),
      token,
      canonical_ref_id:         canonicalRefId,
      canonical_ref_id_version: "sharer",
    })
    .select("token, canonical_ref_id, total_conversions, total_conversions_pending")
    .single();

  if (insertError || !created) {
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }

  // Audit log
  await service.from("canonical_ref_audit").insert({
    canonical_ref_id: canonicalRefId,
    event_type:       "created",
    event_data:       { source: "share_token", user_id: user.id },
  });

  return NextResponse.json({ token: created });
}
