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
      supabase.from("beta_access").select("*").order("created_at", { ascending: false }),
    ]);

    const payments = paymentsRes.data || [];
    const subscriptions = subscriptionsRes.data || [];
    const betaAccess = betaRes.data || [];

    const totalRevenue = payments
      .filter((p: { status: string }) => p.status === "complete")
      .reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0);
    const payingCustomers = new Set(
      payments.filter((p: { status: string }) => p.status === "complete").map((p: { email: string }) => p.email)
    ).size;
    const activeSubscriptions = subscriptions.filter((s: { status: string }) => s.status === "active").length;

    return NextResponse.json({
      stats: {
        totalRevenueCents: totalRevenue,
        payingCustomers,
        activeSubscriptions,
        betaUsers: betaAccess.length,
      },
      payments,
      subscriptions,
      betaAccess,
    });
  } catch (err) {
    console.error("[admin/payments]", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
