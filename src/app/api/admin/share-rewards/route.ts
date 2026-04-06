import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminPermission } from "@/lib/adminAccess";

export async function GET(request: NextRequest) {
  const auth = requireAdminPermission(request, "admin.share_rewards.read");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rewards } = await supabase
    .from("share_rewards")
    .select("reward_id, sharer_email, order_id, credits_amount, status, refund_window_closes_at, fraud_hold_reason, fraud_hold_until, created_at, token")
    .order("created_at", { ascending: false })
    .limit(200);

  return NextResponse.json({ rewards: rewards ?? [] });
}
