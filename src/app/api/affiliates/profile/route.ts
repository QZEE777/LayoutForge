import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function verifySession(email: string, sessionExpiresAt: number, sessionToken: string): boolean {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`sess|${email}|${sessionExpiresAt}`)
    .digest("hex");
  return expected === sessionToken && Date.now() < sessionExpiresAt;
}

export async function PATCH(req: Request) {
  let email: string, sessionToken: string, sessionExpiresAt: number;
  let name: string, website: string, reason: string, avatar_url: string;
  let payout_coin: string | undefined, payout_wallet: string | undefined, payout_memo: string | undefined;
  try {
    const body = await req.json();
    email            = typeof body?.email            === "string" ? body.email.trim().toLowerCase()        : "";
    sessionToken     = typeof body?.sessionToken     === "string" ? body.sessionToken                      : "";
    sessionExpiresAt = typeof body?.sessionExpiresAt === "number" ? body.sessionExpiresAt                  : 0;
    name             = typeof body?.name             === "string" ? body.name.trim().slice(0, 100)         : "";
    website          = typeof body?.website          === "string" ? body.website.trim().slice(0, 200)      : "";
    reason           = typeof body?.reason           === "string" ? body.reason.trim().slice(0, 500)       : "";
    avatar_url       = typeof body?.avatar_url       === "string" ? body.avatar_url.trim().slice(0, 500)   : "";
    payout_coin      = typeof body?.payout_coin      === "string" && ["xrp", "xlm"].includes(body.payout_coin)
                       ? body.payout_coin : undefined;
    payout_wallet    = typeof body?.payout_wallet    === "string" ? body.payout_wallet.trim().slice(0, 200) : undefined;
    payout_memo      = typeof body?.payout_memo      === "string" ? body.payout_memo.trim().slice(0, 50)   : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !sessionToken || !sessionExpiresAt) {
    return NextResponse.json({ error: "Missing auth fields" }, { status: 401 });
  }
  if (!verifySession(email, sessionExpiresAt, sessionToken)) {
    return NextResponse.json({ error: "Session expired or invalid. Please sign in again." }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Build update payload — only include crypto fields if explicitly provided
  const updatePayload: Record<string, string | null> = {
    website: website || null,
    reason:  reason  || null,
    avatar_url: avatar_url || null,
  };
  if (name) updatePayload.name = name;
  if (payout_coin   !== undefined) updatePayload.payout_coin   = payout_coin;
  if (payout_wallet !== undefined) updatePayload.payout_wallet = payout_wallet || null;
  if (payout_memo   !== undefined) updatePayload.payout_memo   = payout_memo   || null;

  const { error } = await supabase
    .from("affiliates")
    .update(updatePayload)
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
