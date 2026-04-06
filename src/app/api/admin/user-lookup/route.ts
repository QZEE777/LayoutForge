import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRateLimit } from "@/lib/rateLimitAdmin";
import { requireAdminPermission } from "@/lib/adminAccess";

export async function GET(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  if (!process.env.ADMIN_PASSWORD_MANU2?.trim()) {
    return NextResponse.json({ error: "Admin password not configured" }, { status: 503 });
  }
  const auth = requireAdminPermission(request, "admin.user_lookup.read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const email = (request.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email param required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const [profilesRes, creditsRes, paymentsRes, nudgesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, created_at").eq("email", email).maybeSingle(),
    supabase.from("scan_credits").select("credits, used, note, created_at").eq("email", email).order("created_at", { ascending: false }),
    supabase.from("payments").select("id, amount, payment_type, status, gateway_order_id, created_at").eq("email", email).order("created_at", { ascending: false }),
    supabase.from("scan_nudges").select("download_id, created_at").eq("email", email).order("created_at", { ascending: false }).limit(50),
  ]);

  const credits = creditsRes.data ?? [];
  const totalCredits = credits.reduce((s, r) => s + (r.credits ?? 0), 0);
  const usedCredits = credits.reduce((s, r) => s + (r.used ?? 0), 0);

  return NextResponse.json({
    profile: profilesRes.data ?? null,
    email,
    credits: {
      total: totalCredits,
      used: usedCredits,
      remaining: Math.max(0, totalCredits - usedCredits),
      rows: credits,
    },
    payments: paymentsRes.data ?? [],
    scans: nudgesRes.data ?? [],
  });
}
