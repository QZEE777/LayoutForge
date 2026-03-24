import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqualStrings } from "@/lib/security";
import { sendAffiliateApprovalEmail } from "@/lib/resend";

function auth(request: NextRequest): boolean {
  const raw = request.headers.get("x-admin-password") ?? "";
  const expected = process.env.ADMIN_PASSWORD_MANU2?.trim();
  return !!expected && timingSafeEqualStrings(raw.trim(), expected);
}

// GET — list all affiliates + referral stats
export async function GET(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [affiliatesRes, referralsRes] = await Promise.all([
    supabase.from("affiliates").select("*").order("created_at", { ascending: false }),
    supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  return NextResponse.json({
    affiliates: affiliatesRes.data ?? [],
    referrals: referralsRes.data ?? [],
  });
}

// POST — approve / suspend / mark-paid actions
export async function POST(request: NextRequest) {
  if (!auth(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let action: string, id: string;
  try {
    const body = await request.json();
    action = body?.action ?? "";
    id = body?.id ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  if (action === "approve") {
    // Fetch affiliate details before updating so we can send the welcome email
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("email, name, code, status")
      .eq("id", id)
      .maybeSingle();

    await supabase.from("affiliates").update({ status: "active" }).eq("id", id);

    // Send approval email only if they weren't already active
    if (affiliate && affiliate.status !== "active") {
      try {
        await sendAffiliateApprovalEmail(affiliate.email, affiliate.name, affiliate.code);
      } catch (err) {
        console.error("[admin/affiliates] approval email failed:", err);
        // Don't fail the request — approval still succeeded
      }
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "suspend") {
    await supabase.from("affiliates").update({ status: "suspended" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (action === "mark-paid") {
    // Mark all unpaid referrals for this affiliate code as paid
    const affiliateCode = id; // here id is the affiliate code
    await supabase
      .from("referrals")
      .update({ paid_out: true, paid_out_at: new Date().toISOString() })
      .eq("affiliate_code", affiliateCode)
      .eq("paid_out", false);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
