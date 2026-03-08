import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRateLimit } from "@/lib/rateLimitAdmin";
import { timingSafeEqualStrings } from "@/lib/security";

export async function GET(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const raw = request.headers.get("x-admin-password") ?? "";
  const password = raw.trim();
  const expected = process.env.ADMIN_PASSWORD_MANU2?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "Admin password not configured", code: "NOT_CONFIGURED" },
      { status: 503 }
    );
  }
  if (!timingSafeEqualStrings(password, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const [paymentsRes, subscriptionsRes, betaRes, formatterLeadsRes, emailCapturesRes] = await Promise.all([
      supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("beta_access").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("formatter_leads").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("email_captures").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    const recentPayments = paymentsRes.data || [];
    const subscriptions = subscriptionsRes.data || [];
    const betaUsage = betaRes.data || [];
    const formatterLeads = formatterLeadsRes.data || [];
    const emailCaptures = emailCapturesRes.data || [];

    const completed = recentPayments.filter((p: { status: string }) => p.status === "complete");
    const totalRevenue = completed.reduce((sum: number, p: { amount: number | null }) => sum + (p.amount || 0), 0);
    const totalPayingCustomers = new Set(completed.map((p: { email: string | null }) => p.email)).size;
    const activeSubscriptions = subscriptions.filter((s: { status: string }) => s.status === "active").length;
    const betaUsers = betaUsage.length;
    const latestPaymentAt =
      recentPayments.length > 0 && (recentPayments[0] as { created_at?: string }).created_at
        ? (recentPayments[0] as { created_at: string }).created_at
        : null;

    return NextResponse.json({
      totalRevenue,
      totalPayingCustomers,
      activeSubscriptions,
      betaUsers,
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
