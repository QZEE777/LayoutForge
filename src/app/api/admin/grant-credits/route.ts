import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqualStrings } from "@/lib/security";

function auth(request: NextRequest): boolean {
  const raw = request.headers.get("x-admin-password") ?? "";
  const expected = process.env.ADMIN_PASSWORD_MANU2?.trim();
  return !!expected && timingSafeEqualStrings(raw.trim(), expected);
}

export async function POST(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let email: string, credits: number, note: string;
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    credits = typeof body?.credits === "number" ? Math.floor(body.credits) : 0;
    note = typeof body?.note === "string" ? body.note.trim().slice(0, 100) : "beta_grant";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (credits < 1 || credits > 100) {
    return NextResponse.json({ error: "Credits must be between 1 and 100" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("scan_credits").insert({
    email,
    credits,
    source: note || "beta_grant",
    // No expires_at — beta credits never expire
  });

  if (error) {
    console.error("[admin/grant-credits]", error);
    return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email, credits });
}
