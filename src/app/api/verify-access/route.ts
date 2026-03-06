import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStored } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const downloadId = typeof body?.downloadId === "string" ? body.downloadId.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const tool = typeof body?.tool === "string" ? body.tool.trim() : "";

    if (tool === "kdp-formatter-pdf") return NextResponse.json({ access: true, type: "free" });

    // 1. This report already paid for (one pay per report): same download id = already unlocked
    if (downloadId) {
      const meta = await getStored(downloadId);
      if (meta?.payment_confirmed) {
        return NextResponse.json({ access: true, type: "paid" });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 2. Beta access for this email + tool
    if (email && tool && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: betaAccess } = await supabase
        .from("beta_access")
        .select("id")
        .eq("email", email)
        .eq("tool", tool)
        .limit(1);
      if (betaAccess?.length) {
        return NextResponse.json({ access: true, type: "beta" });
      }
    }

    // 3. Active subscription: any report unlock for this email
    if (email && supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("email", email)
        .eq("status", "active")
        .gt("current_period_end", new Date().toISOString())
        .limit(1);
      if (sub?.length) {
        return NextResponse.json({ access: true, type: "subscription" });
      }
    }

    return NextResponse.json({ access: false });
  } catch (e) {
    console.error("[verify-access]", e);
    return NextResponse.json({ access: false }, { status: 500 });
  }
}
