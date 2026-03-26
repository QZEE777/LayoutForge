import { NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseClient";

export async function GET() {
  const supabaseAuth = createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("scan_credits")
    .select("credits, used")
    .eq("email", user.email.toLowerCase());

  if (error || !data) {
    return NextResponse.json({ total: 0, used: 0, remaining: 0 });
  }

  const total = data.reduce((sum, row) => sum + (row.credits ?? 0), 0);
  const used = data.reduce((sum, row) => sum + (row.used ?? 0), 0);
  const remaining = Math.max(0, total - used);

  return NextResponse.json({ total, used, remaining });
}
