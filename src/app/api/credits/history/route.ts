import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabaseAuth = await createAuthClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  const email = user?.email?.trim().toLowerCase() ?? "";
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  // Credits ledger (grants + deductions)
  const { data: creditRows } = await supabase
    .from("scan_credits")
    .select("credits, source, order_id, created_at, expires_at")
    .eq("email", email)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(50);

  // Payment history
  const { data: paymentRows } = await supabase
    .from("payments")
    .select("payment_type, amount, status, created_at, gateway_order_id")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = creditRows ?? [];
  const total     = rows.reduce((s, r) => s + (r.credits > 0 ? r.credits  : 0), 0);
  const used      = rows.reduce((s, r) => s + (r.credits < 0 ? -r.credits : 0), 0);
  const remaining = Math.max(0, total - used);

  return NextResponse.json({
    balance: { remaining, total, used },
    credits: rows,
    payments: paymentRows ?? [],
  });
}
