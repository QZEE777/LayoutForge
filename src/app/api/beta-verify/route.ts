import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const code = process.env.BETA_ACCESS_CODE;
  if (!code) {
    return NextResponse.json({ valid: false });
  }

  try {
    const body = await request.json();
    const inputCode = typeof body?.code === "string" ? body.code.trim() : "";
    const tool = typeof body?.tool === "string" ? body.tool : "";
    const email = typeof body?.email === "string" ? body.email.trim() : null;

    if (inputCode !== code) {
      return NextResponse.json({ valid: false });
    }

    await supabase.from("beta_access").insert({
      email: email || null,
      tool: tool || null,
    });

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
