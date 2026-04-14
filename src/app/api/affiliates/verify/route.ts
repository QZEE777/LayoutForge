import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function signToken(secret: string, email: string, code: string, expiresAt: number): string {
  return crypto.createHmac("sha256", secret).update(`aff|${email}|${code}|${expiresAt}`).digest("hex");
}

function signSessionToken(secret: string, email: string, sessionExpiresAt: number): string {
  return crypto.createHmac("sha256", secret).update(`sess|${email}|${sessionExpiresAt}`).digest("hex");
}

export async function POST(req: Request) {
  let email: string, code: string, token: string, expiresAt: number;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    code = typeof body?.code === "string" ? body.code.trim() : "";
    token = typeof body?.token === "string" ? body.token : "";
    expiresAt = typeof body?.expiresAt === "number" ? body.expiresAt : 0;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !code || !token || !expiresAt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (Date.now() > expiresAt) {
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  }

  const signingSecret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!signingSecret) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const expected = signToken(signingSecret, email, code, expiresAt);
  if (expected !== token) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, name, code, status, commission_rate, created_at, website, reason")
    .eq("email", email)
    .maybeSingle();

  if (!affiliate) {
    console.error("[affiliates/verify] lookup failed for:", email);
    return NextResponse.json({ error: "No partner account found for that email." }, { status: 404 });
  }

  // Fetch referral stats
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, converted, sale_amount, commission_amount, paid_out, created_at, converted_at")
    .eq("affiliate_code", affiliate.code)
    .order("created_at", { ascending: false })
    .limit(50);

  const allReferrals = referrals ?? [];
  const conversions = allReferrals.filter((r) => r.converted);
  const totalEarned = conversions.reduce((s: number, r: { commission_amount: number }) => s + (r.commission_amount ?? 0), 0);
  const totalPaid = conversions.filter((r) => r.paid_out).reduce((s: number, r: { commission_amount: number }) => s + (r.commission_amount ?? 0), 0);
  const pendingPayout = totalEarned - totalPaid;

  const sessionExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
  const sessionToken = signSessionToken(signingSecret, email, sessionExpiresAt);

  return NextResponse.json({
    ok: true,
    affiliate: {
      ...affiliate,
      email,
    },
    stats: {
      totalConversions: conversions.length,
      totalEarned,
      totalPaid,
      pendingPayout,
    },
    referrals: allReferrals,
    sessionToken,
    sessionExpiresAt,
  });
}
