import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRateLimit } from "@/lib/rateLimitAdmin";
import { requireAdminPermission } from "@/lib/adminAccess";

export async function GET(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  if (!process.env.ADMIN_PASSWORD_MANU2?.trim()) {
    return NextResponse.json(
      { error: "Admin password not configured", code: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }
  const auth = requireAdminPermission(request, "admin.stats.read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const [paymentsRes, subscriptionsRes, betaRes, formatterLeadsRes, emailCapturesRes, affiliatesRes] = await Promise.all([
      supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("beta_access").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("formatter_leads").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("email_captures").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("affiliates").select("id, status").order("created_at", { ascending: false }),
    ]);

    const recentPayments = paymentsRes.data || [];
    const subscriptions = subscriptionsRes.data || [];
    const betaUsage = betaRes.data || [];
    const formatterLeads = formatterLeadsRes.data || [];
    const emailCaptures = emailCapturesRes.data || [];
    const affiliates = affiliatesRes.data || [];
    const pendingAffiliates = affiliates.filter((a: { status: string }) => a.status === "pending").length;
    const activeAffiliates = affiliates.filter((a: { status: string }) => a.status === "active").length;

    const completed = recentPayments.filter((p: { status: string }) => p.status === "complete");
    const totalRevenue = completed.reduce((sum: number, p: { amount: number | null }) => sum + (p.amount || 0), 0);
    const totalPayingCustomers = new Set(completed.map((p: { email: string | null }) => p.email)).size;
    const activeSubscriptions = subscriptions.filter((s: { status: string }) => s.status === "active").length;
    const betaUsers = betaUsage.length;
    const latestPaymentAt =
      recentPayments.length > 0 && (recentPayments[0] as { created_at?: string }).created_at
        ? (recentPayments[0] as { created_at: string }).created_at
        : null;

    // Revenue breakdown by product type
    type PaymentRow = { status: string; payment_type: string | null; amount: number | null };
    const revenueByType = (completed as PaymentRow[]).reduce<Record<string, number>>((acc, p) => {
      const key = p.payment_type ?? "other";
      acc[key] = (acc[key] ?? 0) + (p.amount ?? 0);
      return acc;
    }, {});

    // Credit stats
    const creditsRes = await supabase
      .from("scan_credits")
      .select("credits, used");
    const creditsRows = creditsRes.data ?? [];
    const totalCreditsIssued = creditsRows.reduce((s: number, r: { credits: number | null }) => s + (r.credits ?? 0), 0);
    const totalCreditsUsed = creditsRows.reduce((s: number, r: { used: number | null }) => s + (r.used ?? 0), 0);

    return NextResponse.json({
      totalRevenue,
      totalPayingCustomers,
      activeSubscriptions,
      betaUsers,
      pendingAffiliates,
      activeAffiliates,
      revenueByType,
      totalCreditsIssued,
      totalCreditsUsed,
      recentPayments,
      subscriptions,
      betaUsage,
      formatterLeads,
      emailCaptures,
      latestPaymentAt,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
