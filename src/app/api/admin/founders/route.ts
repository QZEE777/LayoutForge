import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAdminRateLimit } from "@/lib/rateLimitAdmin";
import { requireAdminPermission } from "@/lib/adminAccess";

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  const auth = requireAdminPermission(request, "admin.founders.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("founder_applications")
    .select("id, full_name, email, primary_platform, follower_count, publishing_platforms, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "Failed to load founder applications" }, { status: 500 });
  return NextResponse.json({ applications: data ?? [] });
}

export async function POST(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  const auth = requireAdminPermission(request, "admin.founders.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const action = typeof body?.action === "string" ? body.action.trim() : "";
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id and valid action are required" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const nextStatus = action === "approve" ? "approved" : "rejected";
  const { data: updated, error: updateError } = await supabase
    .from("founder_applications")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("id, email")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Failed to update application status" }, { status: 500 });
  }

  if (action === "approve") {
    // Founder access flag is applied by email on profiles.
    await supabase
      .from("profiles")
      .update({ is_founder: true })
      .ilike("email", updated.email);
  }

  return NextResponse.json({ ok: true, id, status: nextStatus });
}
