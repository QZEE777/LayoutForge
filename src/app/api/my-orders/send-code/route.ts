import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";

// Rate limit (in-memory, per warm instance — good enough for beta)
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

  // Rate limit: 3 requests per 10 minutes per email
  const now = Date.now();
  const rl = rateLimit.get(email);
  if (rl && now < rl.resetAt) {
    if (rl.count >= 3) {
      return NextResponse.json({ error: "Too many attempts. Try again in 10 minutes." }, { status: 429 });
    }
    rl.count++;
  } else {
    rateLimit.set(email, { count: 1, resetAt: now + 10 * 60 * 1000 });
  }

  // Check if email has any purchases
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("email", email)
    .eq("status", "complete")
    .limit(1)
    .maybeSingle();

  // Always return ok — don't reveal if email exists
  if (!payment) {
    return NextResponse.json({ ok: true, token: null });
  }

  // Generate code + signed token (expires in 10 minutes)
  const code = generateCode();
  const expiresAt = now + 10 * 60 * 1000;
  const token = signToken(email, code, expiresAt);

  // Send verification email
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-bottom: 20px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 20px; font-weight: 700; color: #2D6A2D; letter-spacing: 1px;">manu2print</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 0 16px;">
        <p style="font-size: 16px; font-weight: 600; margin: 0 0 8px;">Your verification code</p>
        <p style="font-size: 14px; color: #6B6151; margin: 0 0 24px;">Enter this code on the manu2print orders page:</p>
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

  // Return signed token to client — used in verify step
  return NextResponse.json({ ok: true, token, expiresAt });
}
