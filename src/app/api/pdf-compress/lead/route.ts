import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST { email } — capture lead for PDF Compressor only. No CloudConvert, no file.
 * Used when compression runs 100% client-side.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: true, message: "Thanks." }); // no DB = still succeed
    }

    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request", message: "Send JSON with email." }, { status: 400 });
    }
    const email = (body?.email as string)?.trim();
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Invalid email", message: "Please enter a valid email address." }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error: insertError } = await supabase
      .from("email_captures")
      .insert({ email, tool: "pdf-compress" });
    if (insertError) console.error("[pdf-compress/lead] Insert failed (non-blocking):", insertError);

    return NextResponse.json({ success: true, message: "Thanks." });
  } catch (e) {
    console.error("[pdf-compress/lead]", e);
    return NextResponse.json({ error: "Internal error", message: "Request failed." }, { status: 500 });
  }
}
