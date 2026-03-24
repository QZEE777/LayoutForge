import { Resend } from "resend";

const FROM = "noreply@manu2print.com";
const SUBJECT = "Your KDP PDF Check — Download Ready";

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendDownloadLinkEmail(to: string, downloadUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const safeUrl = escapeHtmlAttr(downloadUrl);
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
    <tr>
      <td style="padding-bottom: 24px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 22px; font-weight: 700; color: #2D6A2D; letter-spacing: 1px;">manu2print</span>
        <span style="font-size: 13px; color: #6B6151; margin-left: 8px;">KDP PDF Checker</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 0 16px;">
        <p style="font-size: 18px; font-weight: 600; margin: 0 0 12px;">Your report is ready.</p>
        <p style="font-size: 15px; line-height: 1.7; color: #3a3020; margin: 0 0 28px;">
          Thank you for your purchase. Click below to view your KDP PDF Check Report and download your results.
        </p>
        <a href="${safeUrl}"
           style="display: inline-block; padding: 14px 32px; background: #F05A28; color: #ffffff;
                  text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px;">
          View &amp; Download Report →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 0 0; border-top: 1px solid #E0D8C4;">
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          ⚠️ <strong>Save this link</strong> — your file is available for <strong>24 hours</strong>.
        </p>
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          Lost this email? Visit <a href="https://www.manu2print.com/resend-link" style="color: #2D6A2D;">manu2print.com/resend-link</a> to get it resent.
        </p>
        <p style="font-size: 12px; color: #9B8E7E; margin: 16px 0 0;">— manu2print.com</p>
      </td>
    </tr>
  </table>

</body>
</html>
`.trim();

  const text = [
    "Your KDP PDF Check Report is ready.",
    "",
    `View and download your report: ${downloadUrl}`,
    "",
    "⚠ Save this link — your file is available for 24 hours.",
    "",
    "Lost this email? Visit https://www.manu2print.com/resend-link to get it resent.",
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

export async function sendAffiliateApprovalEmail(to: string, name: string, code: string) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const dashUrl = `${appUrl}/affiliates`;
  const refLink = `${appUrl}/?ref=${code}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
    <tr>
      <td style="padding-bottom: 24px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 22px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 22px; font-weight: 700; color: #4cd964;">2print</span>
        <span style="font-size: 13px; color: #6B6151; margin-left: 8px;">Affiliate Program</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 0 16px;">
        <p style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">You're approved, ${name}! 🎉</p>
        <p style="font-size: 15px; line-height: 1.7; color: #3a3020; margin: 0 0 20px;">
          Welcome to the manu2print affiliate program. You earn <strong>40% commission</strong> on every pack sale — up to <strong>$31.60 per referral</strong> — with a 12-month attribution cookie.
        </p>
        <p style="font-size: 14px; font-weight: 600; color: #1A1208; margin: 0 0 8px;">Your referral link:</p>
        <div style="background: #1A1208; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px;">
          <span style="font-size: 14px; color: #4cd964; font-family: monospace;">${refLink}</span>
        </div>
        <a href="${dashUrl}"
           style="display: inline-block; padding: 14px 32px; background: #F05A28; color: #ffffff;
                  text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px;">
          View Your Dashboard →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 0 0; border-top: 1px solid #E0D8C4;">
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          💰 <strong>Commission:</strong> 40% on Author Pack ($7.60), Indie Pack ($15.60), Pro Pack ($31.60)
        </p>
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          🍪 <strong>Cookie:</strong> 12 months — you get credit even if they buy months later
        </p>
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          💳 <strong>Payouts:</strong> Monthly via PayPal once you hit $20 minimum
        </p>
        <p style="font-size: 12px; color: #9B8E7E; margin: 16px 0 0;">Questions? Reply to this email or contact hello@manu2print.com</p>
        <p style="font-size: 12px; color: #9B8E7E; margin: 4px 0 0;">— manu2print.com</p>
      </td>
    </tr>
  </table>

</body>
</html>
`.trim();

  const text = [
    `You're approved, ${name}!`,
    "",
    "Welcome to the manu2print affiliate program.",
    "You earn 40% commission on every pack sale — up to $31.60 per referral — with a 12-month attribution cookie.",
    "",
    `Your referral link: ${refLink}`,
    "",
    `View your dashboard: ${dashUrl}`,
    "",
    "Commission: 40% on Author Pack ($7.60), Indie Pack ($15.60), Pro Pack ($31.60)",
    "Cookie: 12 months",
    "Payouts: Monthly via PayPal, $20 minimum",
    "",
    "Questions? Email hello@manu2print.com",
    "— manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "You're approved! Welcome to the manu2print Affiliate Program 🎉",
    html,
    text,
  });

  if (error) throw error;
  return data;
}
