import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    const platform = typeof body.platform === "string" ? body.platform : "ingram";
    const source = typeof body.source === "string" ? body.source : "homepage";

    const { error } = await supabase.from("platform_waitlist").insert({
      email,
      platform,
      source,
    });

    if (error) {
      // Ignore duplicate email errors (unique constraint) — treat as success
      if (error.code === "23505") {
        return NextResponse.json({ success: true });
      }
      console.error("[platform-waitlist] supabase insert error:", error);
      return NextResponse.json({ error: "Could not save your email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[platform-waitlist] error:", e);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
