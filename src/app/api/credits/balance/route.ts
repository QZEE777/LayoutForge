import { NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("scan_credits")
    .select("credits")
    .eq("email", user.email.toLowerCase())
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error || !data) {
    return NextResponse.json({ total: 0, used: 0, remaining: 0 });
  }

  // Ledger: positive rows = grants, negative rows = usage deductions
  const granted  = data.reduce((sum, row) => sum + (row.credits > 0 ? row.credits  : 0), 0);
  const deducted = data.reduce((sum, row) => sum + (row.credits < 0 ? -row.credits : 0), 0);
  const remaining = Math.max(0, granted - deducted);

  return NextResponse.json({ total: granted, used: deducted, remaining });
}
