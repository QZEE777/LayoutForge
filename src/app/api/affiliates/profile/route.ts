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
  let name: string, website: string, reason: string;
  try {
    const body = await req.json();
    email           = typeof body?.email            === "string" ? body.email.trim().toLowerCase()       : "";
    sessionToken    = typeof body?.sessionToken     === "string" ? body.sessionToken                     : "";
    sessionExpiresAt = typeof body?.sessionExpiresAt === "number" ? body.sessionExpiresAt                : 0;
    name            = typeof body?.name             === "string" ? body.name.trim().slice(0, 100)        : "";
    website         = typeof body?.website          === "string" ? body.website.trim().slice(0, 200)     : "";
    reason          = typeof body?.reason           === "string" ? body.reason.trim().slice(0, 500)      : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !sessionToken || !sessionExpiresAt) {
    return NextResponse.json({ error: "Missing auth fields" }, { status: 401 });
  }
  if (!verifySession(email, sessionExpiresAt, sessionToken)) {
    return NextResponse.json({ error: "Session expired or invalid. Please sign in again." }, { status: 401 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("affiliates")
    .update({ name, website: website || null, reason: reason || null })
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
