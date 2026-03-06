import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const platform = typeof body?.platform === "string" ? body.platform.trim() : "";
    const notifyAll = body?.notify_all === true;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("platform_notifications")
      .insert({ email, platform, notify_all: notifyAll });

    if (error) {
      console.error("[platform-notify] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
