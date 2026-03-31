import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

const OTP_RATE_LIMIT = 5;
const OTP_WINDOW_MS  = 15 * 60 * 1000;
const OTP_EXPIRY_MS  = 10 * 60 * 1000;

function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function signToken(email: string, code: string, expiresAt: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${email}|${code}|${expiresAt}`)
    .digest("hex");
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // DB-based rate limit — survives cold starts
  const windowStart = new Date(Date.now() - OTP_WINDOW_MS).toISOString();
  const { count: recentAttempts } = await supabase
    .from("scan_otp_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("created_at", windowStart);

  if ((recentAttempts ?? 0) >= OTP_RATE_LIMIT) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  // Record attempt before sending
  await supabase.from("scan_otp_attempts").insert({ email });

  // Check if email has any purchases — don't reveal if it doesn't
  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("email", email)
    .eq("status", "complete")
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ ok: true, token: null });
  }

  const now       = Date.now();
  const code      = generateCode();
  const expiresAt = now + OTP_EXPIRY_MS;
  const token     = signToken(email, code, expiresAt);

  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-bottom: 20px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 20px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 20px; font-weight: 700; color: #2D6A2D;">2print</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 0 16px;">
        <p style="font-size: 16px; font-weight: 600; margin: 0 0 8px;">Your verification code</p>
        <p style="font-size: 14px; color: #6B6151; margin: 0 0 24px;">Enter this code to access your account:</p>
        <div style="background: #1A1208; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: 12px; text-align: center; padding: 20px 32px; border-radius: 12px;">
          ${code}
        </div>
        <p style="font-size: 13px; color: #9B8E7E; margin: 20px 0 0;">This code expires in 10 minutes.</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 0 0; border-top: 1px solid #E0D8C4;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0;">If you didn&apos;t request this, ignore this email.</p>
        <p style="font-size: 12px; color: #9B8E7E; margin: 6px 0 0;">— manu2print.com</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    await resend.emails.send({
      from: "noreply@manu2print.com",
      to: email,
      subject: "Your manu2print verification code",
      html,
      text: `Your manu2print verification code: ${code}\n\nExpires in 10 minutes.\n\n— manu2print.com`,
    });
  } catch (err) {
    console.error("[my-orders/send-code] email send failed:", err);
    return NextResponse.json({ error: "Failed to send email. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token, expiresAt });
}
