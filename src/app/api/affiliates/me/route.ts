import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";

export async function GET() {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.email) return NextResponse.json({ affiliate: null });

  const email = user.email.trim().toLowerCase();
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: affiliate } = await service
    .from("affiliates")
    .select("id, name, code, status, commission_rate, created_at, ls_affiliate_code, payout_coin, payout_wallet, payout_memo")
    .eq("email", email)
    .maybeSingle();

  if (!affiliate) return NextResponse.json({ affiliate: null });

  const { data: referrals } = await service
    .from("referrals")
    .select("id, converted, sale_amount, commission_amount, paid_out, created_at")
    .eq("affiliate_code", affiliate.code)
    .order("created_at", { ascending: false })
    .limit(100);

  const all = referrals ?? [];
  const conversions   = all.filter((r) => r.converted);
  const totalEarned   = conversions.reduce((s, r) => s + (r.commission_amount ?? 0), 0);
  const totalPaid     = conversions.filter((r) => r.paid_out).reduce((s, r) => s + (r.commission_amount ?? 0), 0);

  return NextResponse.json({
    affiliate: { ...affiliate, email },
    stats: {
      clicks:        all.length,
      conversions:   conversions.length,
      totalEarned,
      totalPaid,
      pendingPayout: totalEarned - totalPaid,
    },
  });
}
