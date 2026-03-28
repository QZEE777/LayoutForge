import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqualStrings } from "@/lib/security";

function auth(request: NextRequest): boolean {
  const raw = request.headers.get("x-admin-password") ?? "";
  const expected = process.env.ADMIN_PASSWORD_MANU2?.trim();
  return !!expected && timingSafeEqualStrings(raw.trim(), expected);
}

export async function GET(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
