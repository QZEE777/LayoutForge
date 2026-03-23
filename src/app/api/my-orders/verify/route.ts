import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function signToken(email: string, code: string, expiresAt: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${email}|${code}|${expiresAt}`)
    .digest("hex");
}

export async function POST(req: Request) {
  let email: string;
  let code: string;
  let token: string;
  let expiresAt: number;

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

  // Check expiry
  if (Date.now() > expiresAt) {
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  }

  // Verify HMAC signature — prevents brute force / token forgery
  const expected = signToken(email, code, expiresAt);
  const valid = crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(token.padEnd(expected.length, "0").slice(0, expected.length), "hex")
  );

  if (!valid || expected !== token) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  // Fetch orders from Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: payments } = await supabase
    .from("payments")
    .select("id, tool, payment_type, amount, status, created_at, gateway_order_id")
    .eq("email", email)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, plan, status, current_period_end, created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: betaAccess } = await supabase
    .from("beta_access")
    .select("tool, created_at")
    .eq("email", email)
    .limit(5);

  return NextResponse.json({
    ok: true,
    email,
    payments: payments ?? [],
    subscriptions: subscriptions ?? [],
    betaAccess: betaAccess ?? [],
  });
}
