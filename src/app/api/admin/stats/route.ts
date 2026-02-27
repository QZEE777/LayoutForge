import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const password = request.headers.get("x-admin-password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const [paymentsRes, subscriptionsRes, betaRes] = await Promise.all([
      supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("beta_access").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    const recentPayments = paymentsRes.data || [];
    const subscriptions = subscriptionsRes.data || [];
    const betaUsage = betaRes.data || [];

    const completed = recentPayments.filter((p: { status: string }) => p.status === "complete");
    const totalRevenue = completed.reduce((sum: number, p: { amount: number | null }) => sum + (p.amount || 0), 0);
    const totalPayingCustomers = new Set(completed.map((p: { email: string | null }) => p.email)).size;
    const activeSubscriptions = subscriptions.filter((s: { status: string }) => s.status === "active").length;
    const betaUsers = betaUsage.length;

    return NextResponse.json({
      totalRevenue,
      totalPayingCustomers,
      activeSubscriptions,
      betaUsers,
      recentPayments,
      subscriptions,
      betaUsage,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
