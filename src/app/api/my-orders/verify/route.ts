import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { loadAccountPortalData } from "@/lib/accountPortalData";

function signToken(secret: string, email: string, code: string, expiresAt: number): string {
  return crypto.createHmac("sha256", secret).update(`${email}|${code}|${expiresAt}`).digest("hex");
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

  if (Date.now() > expiresAt) {
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  }

  const signingSecret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!signingSecret) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const expected = signToken(signingSecret, email, code, expiresAt);
  const valid = crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(token.padEnd(expected.length, "0").slice(0, expected.length), "hex")
  );

  if (!valid || expected !== token) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  try {
    const data = await loadAccountPortalData(email);
    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    console.error("[my-orders/verify]", e);
    return NextResponse.json({ error: "Failed to load account data." }, { status: 500 });
  }
}
