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

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("scan_credits")
    .select("credits")
    .eq("email", email)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error || !data) {
    return NextResponse.json({ remaining: 0, total: 0, used: 0 });
  }

  const total     = data.reduce((s, r) => s + (r.credits > 0 ? r.credits  : 0), 0);
  const used      = data.reduce((s, r) => s + (r.credits < 0 ? -r.credits : 0), 0);
  const remaining = Math.max(0, total - used);

  return NextResponse.json({ remaining, total, used });
}
