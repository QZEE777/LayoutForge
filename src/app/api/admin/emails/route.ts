import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/admin/emails
 * Returns all rows from email_captures (Supabase), ordered by created_at desc.
 * Auth: header x-admin-key must match process.env.ADMIN_SECRET.
 */
export async function GET(request: NextRequest) {
  const adminKey = request.headers.get("x-admin-key");
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Not configured", message: "ADMIN_SECRET is not set." },
      { status: 503 }
    );
  }
  if (adminKey !== secret) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing x-admin-key." },
      { status: 401 }
    );
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Not configured", message: "Supabase is not set." },
      { status: 503 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("email_captures")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/emails] Supabase error:", error);
      return NextResponse.json(
        { error: "Database error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ emails: data ?? [] });
  } catch (e) {
    console.error("[admin/emails]", e);
    return NextResponse.json(
      { error: "Internal error", message: e instanceof Error ? e.message : "Failed to list emails." },
      { status: 500 }
    );
  }
}
