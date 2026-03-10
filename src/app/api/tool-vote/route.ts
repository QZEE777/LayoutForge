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
    const tool = typeof body?.tool === "string" ? body.tool.trim() : "";
    if (!tool) {
      return NextResponse.json({ error: "tool is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("tool_votes")
      .insert({ tool });

    if (error) {
      console.error("[tool-vote] Supabase error:", error);
      return NextResponse.json({ error: "Failed to record vote" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
