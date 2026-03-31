import { Resend } from "resend";

const FROM         = "noreply@manu2print.com";
const FROM_MANNY   = "Manny from manu2print <manny@manu2print.com>";
const REPLY_TO     = "hello@manu2print.com";
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
        <span style="font-size: 22px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 22px; font-weight: 700; color: #2D6A2D;">2print</span>
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

export async function sendShareCreditAwardedEmail(
  to: string,
  opts: { credits: number; expiresAt: string; wasHeld: boolean }
) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const dashUrl = `${appUrl}/dashboard`;
  const expiryDate = new Date(opts.expiresAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const creditWord = opts.credits === 1 ? "scan credit" : "scan credits";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
    <tr>
      <td style="padding-bottom: 24px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 22px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 22px; font-weight: 700; color: #2D6A2D;">2print</span>
        <span style="font-size: 13px; color: #6B6151; margin-left: 8px;">Share &amp; Earn</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 0 16px;">
        <p style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">Your ${creditWord} ${opts.credits === 1 ? "is" : "are"} ready! 🎉</p>
        <p style="font-size: 15px; line-height: 1.7; color: #3a3020; margin: 0 0 20px;">
          Someone you referred just completed their PDF check. As a thank-you,
          <strong>${opts.credits} free ${creditWord}</strong> ${opts.credits === 1 ? "has" : "have"} been added to your account.
        </p>
        ${opts.wasHeld ? `<p style="font-size: 14px; line-height: 1.6; color: #6B6151; margin: 0 0 20px;">
          This credit was held briefly for review. Everything checked out — it&rsquo;s yours.
        </p>` : ""}
        <div style="background: #1A1208; border-radius: 10px; padding: 16px 20px; margin: 0 0 24px; text-align: center;">
          <p style="font-size: 28px; font-weight: 800; color: #4cd964; margin: 0 0 4px;">+${opts.credits}</p>
          <p style="font-size: 13px; color: #9B8E7E; margin: 0;">Expires ${expiryDate}</p>
        </div>
        <a href="${dashUrl}"
           style="display: inline-block; padding: 14px 32px; background: #F05A28; color: #ffffff;
                  text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px;">
          Use Your Credit →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 0 0; border-top: 1px solid #E0D8C4;">
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          💡 <strong>Keep earning:</strong> every time someone checks their PDF from your share link, you get another free scan.
        </p>
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          🚀 Refer 3 people to unlock <strong>Partner mode</strong> and earn 30–40% cash commission.
        </p>
        <p style="font-size: 12px; color: #9B8E7E; margin: 16px 0 0;">— manu2print.com</p>
      </td>
    </tr>
  </table>

</body>
</html>
`.trim();

  const text = [
    `Your ${creditWord} ${opts.credits === 1 ? "is" : "are"} ready!`,
    "",
    `+${opts.credits} free ${creditWord} added to your account. Expires ${expiryDate}.`,
    "",
    opts.wasHeld ? "This credit was held briefly for review — it's now cleared." : "",
    "",
    `Use your credit: ${dashUrl}`,
    "",
    "Keep earning: every referral = 1 free scan. Refer 3 people to unlock cash commissions.",
    "",
    "— manu2print.com",
  ].filter(Boolean).join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `+${opts.credits} free scan ${creditWord} — your referral paid off 🎉`,
    html,
    text,
  });

  if (error) throw error;
  return data;
}

export async function sendPartnerThresholdEmail(to: string) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const applyUrl = `${appUrl}/partners/apply`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
    <tr>
      <td style="padding-bottom: 24px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 22px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 22px; font-weight: 700; color: #2D6A2D;">2print</span>
        <span style="font-size: 13px; color: #6B6151; margin-left: 8px;">Share &amp; Earn</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 0 16px;">
        <p style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">You&rsquo;ve unlocked Partner mode 🚀</p>
        <p style="font-size: 15px; line-height: 1.7; color: #3a3020; margin: 0 0 20px;">
          You&rsquo;ve referred 3 people to manu2print — that&rsquo;s the threshold to upgrade from free scan credits
          to <strong>real cash commissions</strong>.
        </p>
        <div style="background: #1A1208; border-radius: 10px; padding: 16px 20px; margin: 0 0 24px;">
          <p style="font-size: 14px; color: #9B8E7E; margin: 0 0 10px;">What you unlock as a Partner:</p>
          <p style="font-size: 14px; color: #4cd964; margin: 0 0 6px;">✓ 30% commission on every $9 single scan</p>
          <p style="font-size: 14px; color: #4cd964; margin: 0 0 6px;">✓ 40% commission on every pack sale (up to $31.60)</p>
          <p style="font-size: 14px; color: #4cd964; margin: 0 0 0;">✓ Automatic payouts via LemonSqueezy</p>
        </div>
        <a href="${applyUrl}"
           style="display: inline-block; padding: 14px 32px; background: #F05A28; color: #ffffff;
                  text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px;">
          Activate Partner Mode →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 0 0; border-top: 1px solid #E0D8C4;">
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          Takes under 2 minutes to apply. No minimums. No waitlist.
        </p>
        <p style="font-size: 12px; color: #9B8E7E; margin: 12px 0 0;">— manu2print.com</p>
      </td>
    </tr>
  </table>

</body>
</html>
`.trim();

  const text = [
    "You've unlocked Partner mode!",
    "",
    "You've referred 3 people — that's the threshold to upgrade from free credits to cash commissions.",
    "",
    "What you unlock:",
    "• 30% commission on every $9 single scan",
    "• 40% commission on every pack sale (up to $31.60)",
    "• Monthly payouts via PayPal or Wise",
    "",
    `Activate Partner Mode: ${applyUrl}`,
    "",
    "Takes under 2 minutes. No minimums. No waitlist.",
    "",
    "— manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "You've unlocked Partner mode — earn 30–40% cash commission 🚀",
    html,
    text,
  });

  if (error) throw error;
  return data;
}

export async function sendAffiliateApprovalEmail(to: string, name: string, code: string) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const dashUrl = `${appUrl}/partners`;
  const refLink = `${appUrl}/go/${code}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
    <tr>
      <td style="padding-bottom: 24px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 22px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 22px; font-weight: 700; color: #2D6A2D;">2print</span>
        <span style="font-size: 13px; color: #6B6151; margin-left: 8px;">Partner Program</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 0 16px;">
        <p style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">You're approved, ${name}! 🎉</p>
        <p style="font-size: 15px; line-height: 1.7; color: #3a3020; margin: 0 0 20px;">
          Welcome to the manu2print partner program. You earn <strong>40% commission</strong> on every pack sale — up to <strong>$31.60 per referral</strong> — with a 12-month attribution cookie.
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
          💳 <strong>Payouts:</strong> Automatic via LemonSqueezy — no minimum threshold
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
    "Welcome to the manu2print partner program.",
    "You earn 40% commission on every pack sale — up to $31.60 per referral — with a 12-month attribution cookie.",
    "",
    `Your referral link: ${refLink}`,
    "",
    `View your dashboard: ${dashUrl}`,
    "",
    "Commission: 40% on Author Pack ($7.60), Indie Pack ($15.60), Pro Pack ($31.60)",
    "Cookie: 12 months",
    "Payouts: Automatic via LemonSqueezy — no minimum threshold",
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

export async function sendPackPurchaseEmail(
  to: string,
  opts: { credits: number; packName: string }
) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const checkerUrl = `${appUrl}/kdp-pdf-checker`;
  const dashUrl = `${appUrl}/dashboard`;
  const creditWord = opts.credits === 1 ? "scan credit" : "scan credits";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #FAF7EE; color: #1A1208;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
    <tr>
      <td style="padding-bottom: 24px; border-bottom: 2px solid #2D6A2D;">
        <span style="font-size: 22px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 22px; font-weight: 700; color: #2D6A2D;">2print</span>
        <span style="font-size: 13px; color: #6B6151; margin-left: 8px;">Scan Credits</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 0 16px;">
        <p style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">Your ${opts.packName} is ready. 🎉</p>
        <p style="font-size: 15px; line-height: 1.7; color: #3a3020; margin: 0 0 20px;">
          <strong>${opts.credits} ${creditWord}</strong> ${opts.credits === 1 ? "has" : "have"} been added to your account.
          Use ${opts.credits === 1 ? "it" : "them"} any time to unlock a full annotated KDP compliance report.
        </p>
        <div style="background: #1A1208; border-radius: 10px; padding: 20px 24px; margin: 0 0 24px; text-align: center;">
          <p style="font-size: 40px; font-weight: 900; color: #4cd964; margin: 0 0 4px; line-height: 1;">+${opts.credits}</p>
          <p style="font-size: 13px; color: #9B8E7E; margin: 0;">${creditWord} added to your account</p>
        </div>
        <p style="font-size: 15px; font-weight: 600; margin: 0 0 10px;">How to use your credits:</p>
        <p style="font-size: 14px; color: #6B6151; line-height: 1.6; margin: 0 0 6px;">1. Upload your PDF at the KDP PDF Checker</p>
        <p style="font-size: 14px; color: #6B6151; line-height: 1.6; margin: 0 0 6px;">2. Get your free readiness score</p>
        <p style="font-size: 14px; color: #6B6151; line-height: 1.6; margin: 0 0 24px;">3. Click "Use a Scan Credit" — enter your email and a 6-digit code to unlock the full report</p>
        <a href="${checkerUrl}"
           style="display: inline-block; padding: 14px 32px; background: #F05A28; color: #ffffff;
                  text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px;">
          Check a PDF Now →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 0 0; border-top: 1px solid #E0D8C4;">
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          📊 Check your balance any time at <a href="${dashUrl}" style="color: #2D6A2D;">your dashboard</a>.
        </p>
        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          💡 Credits never expire — use them whenever you're ready.
        </p>
        <p style="font-size: 12px; color: #9B8E7E; margin: 16px 0 0;">— manu2print.com</p>
      </td>
    </tr>
  </table>

</body>
</html>
`.trim();

  const text = [
    `Your ${opts.packName} is ready!`,
    "",
    `${opts.credits} ${creditWord} added to your account.`,
    "",
    "How to use your credits:",
    "1. Upload your PDF at the KDP PDF Checker",
    "2. Get your free readiness score",
    "3. Click 'Use a Scan Credit' and enter your email + 6-digit code",
    "",
    `Check a PDF now: ${checkerUrl}`,
    `Your dashboard: ${dashUrl}`,
    "",
    "Credits never expire.",
    "",
    "— manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Your ${opts.packName} is ready — ${opts.credits} ${creditWord} added ✓`,
    html,
    text,
  });

  if (error) throw error;
  return data;
}

export async function sendWelcomeEmail(to: string, downloadUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const checkerUrl = `${appUrl}/kdp-pdf-checker`;
  const safeDownloadUrl = escapeHtmlAttr(downloadUrl);
  const safeCheckerUrl = escapeHtmlAttr(checkerUrl);

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 0; background: #FAF7EE; color: #1A1208;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">

    <!-- Header -->
    <tr>
      <td style="background: #1A1208; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <span style="font-size: 24px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 24px; font-weight: 700; color: #4cd964;">2print</span>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 36px 32px 24px; background: #FAF7EE;">

        <p style="font-size: 22px; font-weight: 700; color: #1A1208; margin: 0 0 16px; line-height: 1.3;">
          Hey — your KDP report is waiting for you. 👋
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 20px;">
          I'm Manny. I built manu2print because I kept watching indie authors get rejected by KDP for formatting issues that are totally fixable — if you know what to look for.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 20px;">
          Your PDF has already been scanned. Your readiness score is ready. All that's left is unlocking the full report — which shows you <strong>exactly</strong> what's wrong, which pages are affected, and how to fix each issue before you submit to KDP.
        </p>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
          <tr>
            <td style="background: #F05A28; border-radius: 10px;">
              <a href="${safeDownloadUrl}"
                 style="display: inline-block; padding: 16px 36px; color: #ffffff;
                        text-decoration: none; font-weight: 700; font-size: 16px;">
                Unlock my full report — $9 →
              </a>
            </td>
          </tr>
        </table>

        <!-- What they get -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background: #fff; border-radius: 10px; border: 1px solid #E0D8C4; margin: 0 0 28px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-size: 13px; font-weight: 700; color: #1A1208; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                What&apos;s in your full report
              </p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Every issue flagged — bleed, margins, fonts, image resolution</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Exact page numbers for every problem</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Plain-English fix for each issue</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0; line-height: 1.7;">&#10003; &nbsp;Annotated PDF with issues highlighted visually</p>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0 0 8px;">
          Got questions? Just reply to this email — it comes straight to me.
        </p>

        <p style="font-size: 14px; color: #6B6151; margin: 0;">
          Need to check another PDF?
          <a href="${safeCheckerUrl}" style="color: #F05A28; text-decoration: none; font-weight: 600;">Run another check &rarr;</a>
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; border-top: 1px solid #E0D8C4; background: #FAF7EE;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 4px;">— Manny, manu2print.com</p>
        <p style="font-size: 11px; color: #C4B9AC; margin: 0;">Built for indie authors who want to get it right the first time.</p>
      </td>
    </tr>

  </table>

</body>
</html>
`.trim();

  const text = [
    "Hey — your KDP report is waiting for you.",
    "",
    "I'm Manny. I built manu2print because I kept watching indie authors get rejected",
    "by KDP for formatting issues that are totally fixable — if you know what to look for.",
    "",
    "Your PDF has been scanned. Your readiness score is ready.",
    "Unlock the full report to see exactly what's wrong, which pages are affected,",
    "and how to fix each issue before you submit to KDP.",
    "",
    `Unlock my full report — $9: ${downloadUrl}`,
    "",
    "What's in your full report:",
    "✓ Every issue flagged — bleed, margins, fonts, image resolution",
    "✓ Exact page numbers for every problem",
    "✓ Plain-English fix for each issue",
    "✓ Annotated PDF with issues highlighted visually",
    "",
    "Got questions? Just reply to this email — it comes straight to me.",
    "",
    `Need to check another PDF? ${checkerUrl}`,
    "",
    "— Manny, manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: "Your KDP readiness report is waiting — here's what we found",
    html,
    text,
  });

  if (error) throw error;
  return data;
}
