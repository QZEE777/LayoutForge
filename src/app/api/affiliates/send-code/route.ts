import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";
import { AFFILIATE_OTP_SUBJECT } from "@/lib/emailSubjects";

const rateLimit = new Map<string, { count: number; resetAt: number }>();

function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function signToken(secret: string, email: string, code: string, expiresAt: number): string {
  return crypto.createHmac("sha256", secret).update(`aff|${email}|${code}|${expiresAt}`).digest("hex");
}

export async function POST(req: Request) {
  let email: string;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  const signingSecret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!signingSecret) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const now = Date.now();
  const rl = rateLimit.get(email);
  if (rl && now < rl.resetAt) {
    if (rl.count >= 3) return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });
    rl.count++;
  } else {
    rateLimit.set(email, { count: 1, resetAt: now + 10 * 60 * 1000 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  // Always return ok — don't reveal if email exists
  if (!affiliate) return NextResponse.json({ ok: true, token: null });

  const code = generateCode();
  const expiresAt = now + 10 * 60 * 1000;
  const token = signToken(signingSecret, email, code, expiresAt);

  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:20px;font-weight:700;border-bottom:2px solid #2D6A2D;padding-bottom:16px;margin-bottom:24px;"><span style="color:#F05A28;">manu</span><span style="color:#2D6A2D;">2print</span> <span style="font-size:14px;font-weight:400;color:#6B6151;">— Affiliates</span></p>
  <p style="font-size:15px;font-weight:600;margin:0 0 8px;">Your verification code</p>
  <p style="font-size:14px;color:#6B6151;margin:0 0 20px;">Enter this to access your affiliate dashboard:</p>
  <div style="background:#1A1208;color:#fff;font-size:36px;font-weight:700;letter-spacing:12px;text-align:center;padding:20px 32px;border-radius:12px;">${code}</div>
  <p style="font-size:13px;color:#9B8E7E;margin:16px 0 0;">Expires in 10 minutes. Don't share this code.</p>
  <p style="font-size:12px;color:#9B8E7E;margin:20px 0 0;border-top:1px solid #E0D8C4;padding-top:16px;">— manu2print.com</p>
</body></html>`.trim();

  try {
    await resend.emails.send({
      from: "noreply@manu2print.com",
      to: email,
      subject: AFFILIATE_OTP_SUBJECT,
      html,
      text: `Your manu2print affiliate verification code: ${code}\n\nExpires in 10 minutes.\n\n— manu2print.com`,
    });
  } catch (err) {
    console.error("[affiliates/send-code]", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token, expiresAt });
}
