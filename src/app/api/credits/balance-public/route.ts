import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Gate: only respond for emails with a recent completed payment (30-min window).
  // Prevents arbitrary email enumeration — the success page polls right after purchase
  // so this window is always satisfied for legitimate use.
  const window30 = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: recentPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("email", email)
    .eq("status", "complete")
    .gte("created_at", window30)
    .limit(1)
    .maybeSingle();

  if (!recentPayment) {
    return NextResponse.json({ remaining: 0 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("scan_credits")
    .select("credits")
    .eq("email", email)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error || !data) {
    return NextResponse.json({ remaining: 0 });
  }

  const total     = data.reduce((s, r) => s + (r.credits > 0 ? r.credits  : 0), 0);
  const used      = data.reduce((s, r) => s + (r.credits < 0 ? -r.credits : 0), 0);
  const remaining = Math.max(0, total - used);

  return NextResponse.json({ remaining });
}
