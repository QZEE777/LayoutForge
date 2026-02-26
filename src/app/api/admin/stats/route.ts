import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const password = request.headers.get("x-admin-password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

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
