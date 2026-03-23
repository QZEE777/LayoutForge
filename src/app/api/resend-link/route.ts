import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendDownloadLinkEmail } from "@/lib/resend";

// Rate limit: max 3 requests per email per hour (in-memory, resets on redeploy)
const attempts = new Map<string, { count: number; resetAt: number }>();

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

  // Rate limit
  const now = Date.now();
  const rec = attempts.get(email);
  if (rec && now < rec.resetAt) {
    if (rec.count >= 3) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in an hour." },
        { status: 429 }
      );
    }
    rec.count++;
  } else {
    attempts.set(email, { count: 1, resetAt: now + 60 * 60 * 1000 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Find most recent completed payment for this email
  const { data: payment } = await supabase
    .from("payments")
    .select("id, tool")
    .eq("email", email)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Always return success (don't reveal if email exists or not)
  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  // Find the most recent download ID from storage metadata for this email
  // We look it up via the gateway_order_id stored in payments
  // For now send a generic "check your download page" link since download IDs
  // are stored in file metadata, not in supabase payments table.
  // We send a link to the download page with a prompt to check their original email.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";

  try {
    await sendResendHelpEmail(email, appUrl);
  } catch (err) {
    console.error("[resend-link] email send failed:", err);
    // Still return ok — don't expose errors
  }

  return NextResponse.json({ ok: true });
}

async function sendResendHelpEmail(to: string, appUrl: string) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding-bottom: 24px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 22px; font-weight: 700; color: #2D6A2D; letter-spacing: 1px;">manu2print</span>
        <span style="font-size: 13px; color: #6B6151; margin-left: 8px;">KDP PDF Checker</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 0 16px;">
        <p style="font-size: 17px; font-weight: 600; margin: 0 0 12px;">Download link help</p>
        <p style="font-size: 15px; line-height: 1.7; color: #3a3020; margin: 0 0 16px;">
          We found a purchase on your account. Your download link was sent in your original order confirmation email — please check your inbox (and spam folder) for an email with subject <strong>&ldquo;Your KDP PDF Check — Download Ready&rdquo;</strong>.
        </p>
        <p style="font-size: 15px; line-height: 1.7; color: #3a3020; margin: 0 0 28px;">
          If your file has expired (files are stored for 24 hours), please upload your PDF again at the link below — your purchase history is on file and we&apos;ll honour it.
        </p>
        <a href="${appUrl}/kdp-pdf-checker"
           style="display: inline-block; padding: 14px 32px; background: #F05A28; color: #ffffff;
                  text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px;">
          Re-check my PDF →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 0 0; border-top: 1px solid #E0D8C4;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0;">
          Questions? Reply to this email — we&apos;re here to help.
        </p>
        <p style="font-size: 12px; color: #9B8E7E; margin: 8px 0 0;">— manu2print.com</p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  await resend.emails.send({
    from: "noreply@manu2print.com",
    to,
    subject: "Your manu2print download link",
    html,
    text: [
      "Download link help",
      "",
      "We found a purchase on your account.",
      "",
      "Your download link was sent in your original order confirmation — check your inbox for 'Your KDP PDF Check — Download Ready'.",
      "",
      "If your file has expired (files are stored 24 hours), upload your PDF again at:",
      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com"}/kdp-pdf-checker`,
      "",
      "— manu2print.com",
    ].join("\n"),
  });
}
