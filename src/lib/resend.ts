import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "noreply@manu2print.com";
const SUBJECT = "Your KDP PDF Check Report is Ready";

/**
 * Send a transactional email with a download link (e.g. after purchase).
 * Not wired to any route — call from your API when ready.
 */
function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendDownloadLinkEmail(to: string, downloadUrl: string) {
  const safeUrl = escapeHtmlAttr(downloadUrl);
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1a1a12;">
  <p style="font-size: 16px; line-height: 1.6;">Thank you for your purchase.</p>
  <p style="font-size: 16px; line-height: 1.6;">Your KDP PDF Check Report is ready. Click the button below to download it.</p>
  <p style="margin: 28px 0;">
    <a href="${safeUrl}" style="display: inline-block; padding: 14px 28px; background: #D4A843; color: #1a1a12; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">Download your report</a>
  </p>
  <p style="font-size: 14px; color: #666;">This link is permanent — you can return anytime to download your file.</p>
  <p style="font-size: 14px; color: #666; margin-top: 24px;">— manu2print.com</p>
</body>
</html>
`.trim();

  const text = [
    "Thank you for your purchase.",
    "Your KDP PDF Check Report is ready.",
    "",
    `Download your report: ${downloadUrl}`,
    "",
    "This link is permanent — you can return anytime to download your file.",
    "",
    "— manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: SUBJECT,
    html,
    text,
  });

  if (error) throw error;
  return data;
}
