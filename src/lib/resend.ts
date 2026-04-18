import { Resend } from "resend";
import { DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS } from "./r2Storage";
import { logEmailSend } from "./logEmailSend";
import {
  affiliateApprovalSubject,
  ANNOTATED_PDF_SUBJECT,
  downloadLinkReportSubject,
  packPurchaseSubject,
  PARTNER_THRESHOLD_SUBJECT,
  shareCreditAwardedSubject,
  sharePurchasePendingSubject,
  WELCOME_EMAIL_SUBJECT,
} from "./emailSubjects";
import { MARKETING_UNSUBSCRIBE_FOOTER_TEXT } from "./emailMarketingFooter";

const FROM         = "noreply@manu2print.com";
const FROM_MANNY   = "Manny from manu2print <manny@manu2print.com>";
const REPLY_TO     = "hello@manu2print.com";

function escapeHtmlAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendDownloadLinkEmail(
  to: string,
  reportUrl: string,
  annotatedPdfUrl?: string,
  name?: string,
) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const safeReportUrl = escapeHtmlAttr(reportUrl);
  const safeAnnotatedUrl = annotatedPdfUrl ? escapeHtmlAttr(annotatedPdfUrl) : null;
  const firstName = name ? name.split(" ")[0] : "";
  const greeting = firstName ? `Hey ${firstName} —` : "You're in.";
  const subjectLine = downloadLinkReportSubject(firstName || undefined);

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
          ${greeting} your report is ready. Here are your downloads.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 24px;">
          Your full KDP PDF Check Report is ready — every issue, every page, every fix. Two files are waiting for you below.
        </p>

        ${safeAnnotatedUrl ? `
        <!-- CTA 1: Annotated PDF -->
        <p style="font-size: 12px; font-weight: 700; color: #6B6151; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px;">Your annotated manuscript</p>
        <table cellpadding="0" cellspacing="0" style="margin: 0 0 20px; width: 100%;">
          <tr>
            <td style="background: #1A1208; border-radius: 10px;">
              <a href="${safeAnnotatedUrl}"
                 style="display: block; padding: 16px 28px; color: #4cd964;
                        text-decoration: none; font-weight: 700; font-size: 16px;">
                &#8595; Download Annotated PDF
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 28px;">Your uploaded book with every flagged issue marked directly on the page.</p>
        ` : ""}

        <!-- CTA 2: Full Report -->
        <p style="font-size: 12px; font-weight: 700; color: #6B6151; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px;">Your full diagnostic report</p>
        <table cellpadding="0" cellspacing="0" style="margin: 0 0 20px; width: 100%;">
          <tr>
            <td style="background: #F05A28; border-radius: 10px;">
              <a href="${safeReportUrl}"
                 style="display: block; padding: 16px 28px; color: #ffffff;
                        text-decoration: none; font-weight: 700; font-size: 16px;">
                &#8594; View Full Report &amp; Fix Instructions
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 28px;">Every issue explained in plain English — what's wrong, which page, how to fix it.</p>

        <!-- What's inside -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background: #fff; border-radius: 10px; border: 1px solid #E0D8C4; margin: 0 0 24px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-size: 13px; font-weight: 700; color: #1A1208; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                Your report includes
              </p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Every formatting issue flagged — bleed, margins, fonts, image resolution</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Exact page numbers for every problem</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Plain-English fix instructions for each issue</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0; line-height: 1.7;">&#10003; &nbsp;Annotated PDF with issues highlighted directly on your pages</p>
            </td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #6B6151; margin: 0 0 6px;">
          🔖 <strong>Bookmark this email</strong> — your report and annotated PDF are saved and accessible anytime.
        </p>

        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 16px 0 0;">
          Got questions about your results? Just reply — I read every one.
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
    firstName ? `Hey ${firstName} — your report is ready. Here are your downloads.` : "You're in. Your report is ready. Here are your downloads.",
    "",
    "Your full KDP PDF Check Report is ready — every issue, every page, every fix.",
    "",
    ...(annotatedPdfUrl
      ? [
          "DOWNLOAD 1 — Annotated Manuscript PDF",
          `(Your book with every flagged issue marked on the page)`,
          annotatedPdfUrl,
          "",
        ]
      : []),
    "DOWNLOAD 2 — Full Diagnostic Report",
    "(Every issue explained in plain English — what's wrong, which page, how to fix it)",
    reportUrl,
    "",
    "Your report includes:",
    "✓ Every formatting issue flagged — bleed, margins, fonts, image resolution",
    "✓ Exact page numbers for every problem",
    "✓ Plain-English fix instructions for each issue",
    "✓ Annotated PDF with issues highlighted directly on your pages",
    "",
    "🔖 Bookmark this email — your report and annotated PDF are saved and accessible anytime.",
    "",
    "Got questions about your results? Just reply — I read every one.",
    "",
    "— Manny, manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: subjectLine,
    html,
    text,
  });

  if (error) throw error;
  await logEmailSend({
    recipientEmail: to,
    eventType: "download_link",
    subject: subjectLine,
    resendMessageId: data?.id,
    metadata: { has_first_name: Boolean(firstName) },
  });
  return data;
}

export async function sendShareCreditAwardedEmail(
  to: string,
  opts: { credits: number; expiresAt: string; wasHeld: boolean }
) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const checkerUrl = `${appUrl}/kdp-pdf-checker`;
  const safeCheckerUrl = escapeHtmlAttr(checkerUrl);
  const expiryDate = new Date(opts.expiresAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const creditWord = opts.credits === 1 ? "scan credit" : "scan credits";

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

        <p style="font-size: 22px; font-weight: 700; color: #1A1208; margin: 0 0 20px; line-height: 1.3;">
          Someone you referred just bought through your link.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 12px;">
          That means your share link converted — and you earned it.
        </p>

        ${opts.wasHeld ? `<p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 12px;">
          This one was held briefly while we verified it. Everything checked out — it&rsquo;s yours.
        </p>` : ""}

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 24px;">
          <strong>${opts.credits} free ${creditWord}</strong> ${opts.credits === 1 ? "has" : "have"} been added to your account. Use ${opts.credits === 1 ? "it" : "them"} on your next PDF check — no charge.
        </p>

        <!-- Credit badge -->
        <div style="background: #1A1208; border-radius: 10px; padding: 20px 24px; margin: 0 0 28px; text-align: center;">
          <p style="font-size: 44px; font-weight: 900; color: #4cd964; margin: 0 0 4px; line-height: 1;">+${opts.credits}</p>
          <p style="font-size: 13px; color: #9B8E7E; margin: 0;">Expires ${expiryDate}</p>
        </div>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
          <tr>
            <td style="background: #F05A28; border-radius: 10px;">
              <a href="${safeCheckerUrl}"
                 style="display: inline-block; padding: 16px 36px; color: #ffffff;
                        text-decoration: none; font-weight: 700; font-size: 16px;">
                Run a Free Check &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0 0 6px;">
          Every purchase through your link earns you another free scan credit. Keep sharing.
        </p>
        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0;">
          Refer 3 people total and you unlock <strong>Partner mode</strong> — real cash commissions, no minimums.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; border-top: 1px solid #E0D8C4; background: #FAF7EE;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 4px;">— Manny, manu2print.com</p>
        <p style="font-size: 11px; color: #C4B9AC; margin: 0;">Thank you for spreading the word. It means more than you know.</p>
      </td>
    </tr>

  </table>

</body>
</html>
`.trim();

  const text = [
    "Someone you referred just bought through your link.",
    "",
    "That means your share link converted — and you earned it.",
    "",
    opts.wasHeld ? "This one was held briefly for review. Everything checked out — it's yours." : "",
    `+${opts.credits} free ${creditWord} added to your account. Expires ${expiryDate}.`,
    "",
    `Run a free check now: ${checkerUrl}`,
    "",
    "Every purchase through your link can earn another free scan credit.",
    "If you ever want to go further, 3 total referrals unlock optional Partner mode with cash commissions.",
    "",
    "Thank you for spreading the word.",
    "",
    "— Manny, manu2print.com",
  ].filter(Boolean).join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: shareCreditAwardedSubject(opts.credits, creditWord),
    html,
    text,
  });

  if (error) throw error;
  return data;
}

export async function sendSharePurchasePendingEmail(
  to: string,
  opts: {
    credits: number;
    refundWindowClosesAt: string;
    underReview: boolean;
    totalReferrals?: number;
  }
) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const accountUrl = `${appUrl}/account`;
  const checkerUrl = `${appUrl}/kdp-pdf-checker`;
  const safeAccountUrl = escapeHtmlAttr(accountUrl);
  const safeCheckerUrl = escapeHtmlAttr(checkerUrl);
  const creditWord = opts.credits === 1 ? "scan credit" : "scan credits";
  const releaseDate = new Date(opts.refundWindowClosesAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const progressText = typeof opts.totalReferrals === "number"
    ? `You are now at ${opts.totalReferrals} total referral${opts.totalReferrals === 1 ? "" : "s"}.`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 0; background: #FAF7EE; color: #1A1208;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
    <tr>
      <td style="background: #1A1208; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <span style="font-size: 24px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 24px; font-weight: 700; color: #4cd964;">2print</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 36px 32px 24px; background: #FAF7EE;">
        <p style="font-size: 22px; font-weight: 700; color: #1A1208; margin: 0 0 18px; line-height: 1.3;">
          Nice one — your link just converted.
        </p>
        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 12px;">
          We tracked a purchase from your share link and queued <strong>+${opts.credits} ${creditWord}</strong> for your account.
        </p>
        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 12px;">
          Credits are released after the refund window closes on <strong>${releaseDate}</strong>.
        </p>
        ${opts.underReview ? `<p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0 0 12px;">
          This referral is in a short review hold first, then it releases automatically if all checks pass.
        </p>` : ""}
        ${progressText ? `<p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0 0 16px;">${progressText}</p>` : ""}
        <table cellpadding="0" cellspacing="0" style="margin: 0 0 20px;">
          <tr>
            <td style="background: #F05A28; border-radius: 10px;">
              <a href="${safeAccountUrl}" style="display: inline-block; padding: 14px 30px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px;">
                View progress in dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0 0 6px;">
          If you ever feel like sharing more, 3 total referrals unlock optional <strong>Partner mode</strong> with cash commissions.
        </p>
        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0;">
          No pressure — free scan credits keep working either way.
        </p>
        <p style="font-size: 13px; line-height: 1.8; margin: 12px 0 0;">
          <a href="${safeCheckerUrl}" style="color: #F05A28; text-decoration: none; font-weight: 600;">Copy/share your checker link again &rarr;</a>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 32px; border-top: 1px solid #E0D8C4; background: #FAF7EE;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 4px;">— Manny, manu2print.com</p>
        <p style="font-size: 11px; color: #C4B9AC; margin: 0;">Thanks for helping fellow authors publish cleaner books.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const text = [
    "Nice one — your link just converted.",
    "",
    `We tracked a purchase from your share link and queued +${opts.credits} ${creditWord} for your account.`,
    `Credits are released after the refund window closes on ${releaseDate}.`,
    opts.underReview ? "This referral is in a short review hold first, then releases automatically." : "",
    progressText,
    "",
    `View progress in dashboard: ${accountUrl}`,
    "",
    "If you ever feel like sharing more, 3 total referrals unlock optional Partner mode with cash commissions.",
    "No pressure — free scan credits keep working either way.",
    "",
    `Checker link: ${checkerUrl}`,
    "",
    "— Manny, manu2print.com",
  ].filter(Boolean).join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: sharePurchasePendingSubject(opts.credits, creditWord),
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
  const safeApplyUrl = escapeHtmlAttr(applyUrl);

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

        <p style="font-size: 22px; font-weight: 700; color: #1A1208; margin: 0 0 20px; line-height: 1.3;">
          You've referred 3 people. That's the threshold.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 12px;">
          Thank you. Seriously. You've been sending authors our way and it's made a difference.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 24px;">
          Three referrals is where free scan credits end and real cash commissions begin. You've earned the upgrade.
        </p>

        <!-- Unlock box -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background: #1A1208; border-radius: 10px; margin: 0 0 28px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-size: 13px; font-weight: 700; color: #9B8E7E; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                What Partner mode unlocks
              </p>
              <p style="font-size: 14px; color: #4cd964; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;30% commission on every $9 single scan</p>
              <p style="font-size: 14px; color: #4cd964; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;40% commission on every pack sale — up to $31.60 per referral</p>
              <p style="font-size: 14px; color: #4cd964; margin: 0; line-height: 1.7;">&#10003; &nbsp;Monthly payouts via Wise — direct to your bank, no third-party account needed</p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
          <tr>
            <td style="background: #F05A28; border-radius: 10px;">
              <a href="${safeApplyUrl}"
                 style="display: inline-block; padding: 16px 36px; color: #ffffff;
                        text-decoration: none; font-weight: 700; font-size: 16px;">
                Activate Partner Mode &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0;">
          Takes under 2 minutes. No minimums. No waitlist.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; border-top: 1px solid #E0D8C4; background: #FAF7EE;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 4px;">— Manny, manu2print.com</p>
        <p style="font-size: 11px; color: #C4B9AC; margin: 0;">Questions? Just reply — I read every one.</p>
      </td>
    </tr>

  </table>

</body>
</html>
`.trim();

  const text = [
    "You've referred 3 people. That's the threshold.",
    "",
    "Thank you. Seriously. You've been sending authors our way and it's made a difference.",
    "",
    "Three referrals is where free scan credits end and real cash commissions begin.",
    "You've earned the upgrade.",
    "",
    "What Partner mode unlocks:",
    "✓ 30% commission on every $9 single scan",
    "✓ 40% commission on every pack sale — up to $31.60 per referral",
    "✓ Monthly payouts via Wise — direct to your bank, no third-party account needed",
    "",
    `Activate Partner Mode: ${applyUrl}`,
    "",
    "Takes under 2 minutes. No minimums. No waitlist.",
    "",
    "— Manny, manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: PARTNER_THRESHOLD_SUBJECT,
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
  const safeDashUrl = escapeHtmlAttr(dashUrl);
  const safeRefLink = escapeHtmlAttr(refLink);
  const firstName = name.split(" ")[0] || name;

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

        <p style="font-size: 22px; font-weight: 700; color: #1A1208; margin: 0 0 20px; line-height: 1.3;">
          You're approved, ${firstName} — welcome to the crew. 🎉
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 12px;">
          Your referral link is ready to go — share it, post it, DM it, tattoo it on your laptop if you want:
        </p>

        <!-- Referral link -->
        <div style="background: #1A1208; border-radius: 8px; padding: 14px 18px; margin: 0 0 28px;">
          <a href="${safeRefLink}" style="font-size: 14px; color: #4cd964; font-family: monospace; text-decoration: none; word-break: break-all;">${refLink}</a>
        </div>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 24px;">
          Every KDP author who checks their PDF through your link earns you cold, hard commission:
        </p>

        <!-- Details -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background: #fff; border-radius: 10px; border: 1px solid #E0D8C4; margin: 0 0 20px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-size: 13px; font-weight: 700; color: #1A1208; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                Your commission breakdown
              </p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Single scan — 30% = <strong>$2.70</strong></p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Author Pack — 40% = <strong>$7.60</strong></p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Indie Pack — 40% = <strong>$15.60</strong></p>
              <p style="font-size: 14px; color: #3a3020; margin: 0; line-height: 1.7;">&#10003; &nbsp;Pro Pack — 40% = <strong>$31.60</strong></p>
            </td>
          </tr>
        </table>

        <!-- LS heads up -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background: #FEF3C7; border-radius: 10px; border: 1px solid #FDE68A; margin: 0 0 28px;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="font-size: 14px; color: #92400E; margin: 0; line-height: 1.7;">
                <strong>One heads up on payouts:</strong> We pay monthly via Wise bank transfer — direct to your bank, no third-party account needed. Just reply to this email with your bank details (account number, bank name, country) and we&apos;ll get your first payout set up.<br><br>
                In the meantime, nothing stops you from sharing your link <em>right now</em>. Every click counts from this moment.
              </p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
          <tr>
            <td style="background: #F05A28; border-radius: 10px;">
              <a href="${safeDashUrl}"
                 style="display: inline-block; padding: 16px 36px; color: #ffffff;
                        text-decoration: none; font-weight: 700; font-size: 16px;">
                View Your Dashboard &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0;">
          12-month cookie. No cap. No minimums. Just send authors our way and let the tool close for you.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; border-top: 1px solid #E0D8C4; background: #FAF7EE;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 4px;">— Manny, manu2print.com</p>
        <p style="font-size: 11px; color: #C4B9AC; margin: 0;">Questions? Just reply — I read every one.</p>
      </td>
    </tr>

  </table>

</body>
</html>
`.trim();

  const text = [
    `You're approved, ${firstName} — welcome to the crew. 🎉`,
    "",
    "Your referral link is ready to go — share it, post it, DM it, tattoo it on your laptop if you want:",
    "",
    `  ${refLink}`,
    "",
    "Every KDP author who checks their PDF through your link earns you cold, hard commission:",
    "",
    "Commission breakdown:",
    "✓ Single scan — 30% = $2.70",
    "✓ Author Pack — 40% = $7.60",
    "✓ Indie Pack — 40% = $15.60",
    "✓ Pro Pack — 40% = $31.60",
    "",
    "One heads up on payouts: We pay monthly via Wise bank transfer — direct to your bank, no third-party account needed. Just reply with your bank details (account number, bank name, country) and we'll get your first payout set up.",
    "In the meantime, nothing stops you from sharing your link right now. Every click counts from this moment.",
    "",
    `View your dashboard: ${dashUrl}`,
    "",
    "12-month cookie. No cap. No minimums. Just send authors our way and let the tool close for you.",
    "",
    "— Manny, manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: affiliateApprovalSubject(firstName),
    html,
    text,
  });

  if (error) throw error;
  return data;
}

export async function sendPackPurchaseEmail(
  to: string,
  opts: { credits: number; packName: string; name?: string }
) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const checkerUrl = `${appUrl}/kdp-pdf-checker`;
  const accountUrl = `${appUrl}/account`;
  const safeCheckerUrl = escapeHtmlAttr(checkerUrl);
  const safeAccountUrl = escapeHtmlAttr(accountUrl);
  const creditWord = opts.credits === 1 ? "scan credit" : "scan credits";
  const firstName = opts.name ? opts.name.split(" ")[0] : "";

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

        <p style="font-size: 22px; font-weight: 700; color: #1A1208; margin: 0 0 20px; line-height: 1.3;">
          ${firstName ? `Hey ${firstName} — ` : ""}${opts.packName} confirmed. Your credits are loaded.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 12px;">
          Thank you — genuinely. You didn't just buy a tool, you decided to get your book right before KDP gets to tell you it isn't.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 24px;">
          That's the move most authors skip. You didn't.
        </p>

        <!-- Credit badge -->
        <div style="background: #1A1208; border-radius: 10px; padding: 20px 24px; margin: 0 0 28px; text-align: center;">
          <p style="font-size: 44px; font-weight: 900; color: #4cd964; margin: 0 0 4px; line-height: 1;">+${opts.credits}</p>
          <p style="font-size: 14px; color: #9B8E7E; margin: 0;">${creditWord} ready to use</p>
        </div>

        <!-- How it works -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background: #fff; border-radius: 10px; border: 1px solid #E0D8C4; margin: 0 0 28px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-size: 13px; font-weight: 700; color: #1A1208; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                When you're ready to run a check
              </p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">1. &nbsp;Upload your PDF at the KDP PDF Checker</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">2. &nbsp;Get your free readiness score</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0; line-height: 1.7;">3. &nbsp;Click <strong>"Use a Scan Credit"</strong> — enter your email and the 6-digit code we send you</p>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px;">
          <tr>
            <td style="background: #F05A28; border-radius: 10px;">
              <a href="${safeCheckerUrl}"
                 style="display: inline-block; padding: 16px 36px; color: #ffffff;
                        text-decoration: none; font-weight: 700; font-size: 16px;">
                Check a PDF Now &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0 0 6px;">
          Credits never expire — use them when you're ready.
        </p>
        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0;">
          Check your balance any time at <a href="${safeAccountUrl}" style="color: #F05A28; text-decoration: none;">your account</a>.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; border-top: 1px solid #E0D8C4; background: #FAF7EE;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 4px;">— Manny, manu2print.com</p>
        <p style="font-size: 11px; color: #C4B9AC; margin: 0;">Got a question about your file? Just reply — I read every one.</p>
      </td>
    </tr>

  </table>

</body>
</html>
`.trim();

  const text = [
    firstName
      ? `Hey ${firstName} — ${opts.packName} confirmed. Your credits are loaded.`
      : `${opts.packName} confirmed. Your credits are loaded.`,
    "",
    "Thank you — genuinely. You decided to get your book right before KDP gets to tell you it isn't.",
    "That's the move most authors skip. You didn't.",
    "",
    `+${opts.credits} ${creditWord} ready to use. Credits never expire.`,
    "",
    "When you're ready to run a check:",
    "1. Upload your PDF at the KDP PDF Checker",
    "2. Get your free readiness score",
    "3. Click 'Use a Scan Credit' — enter your email and the 6-digit code we send you",
    "",
    `Check a PDF now: ${checkerUrl}`,
    `Your account: ${accountUrl}`,
    "",
    "Got a question? Just reply — I read every one.",
    "",
    "— Manny, manu2print.com",
  ].join("\n");

  const packSubject = packPurchaseSubject(
    opts.name ? opts.name.split(" ")[0] : undefined,
    opts.packName,
    opts.credits,
    creditWord
  );

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: packSubject,
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

        <p style="font-size: 22px; font-weight: 700; color: #1A1208; margin: 0 0 20px; line-height: 1.3;">
          Your KDP readiness score is ready.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 6px;">
          I'm Manny. I built manu2print after watching too many solid books get rejected for things no one warns you about.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 6px;">
          Margins slightly off.<br>
          Bleed missing.<br>
          Fonts not embedded.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 20px;">
          You only find out after you upload… wait… and get the rejection.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 6px;">
          That's usually when people start looking for answers.
        </p>

        <p style="font-size: 15px; font-weight: 600; color: #1A1208; margin: 0 0 24px;">
          That's why you're here.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 8px;">
          Your PDF has been scanned. The full report shows you exactly what's flagged, which pages are affected, and what to fix — before you submit to KDP.
        </p>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" style="margin: 32px 0;">
          <tr>
            <td style="background: #F05A28; border-radius: 10px;">
              <a href="${safeDownloadUrl}"
                 style="display: inline-block; padding: 16px 36px; color: #ffffff;
                        text-decoration: none; font-weight: 700; font-size: 16px;">
                See your full report — $9 &rarr;
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
                Your full report includes
              </p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Every issue flagged — bleed, margins, fonts, image resolution</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Exact page numbers for every problem</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Plain-English fix for each issue</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0; line-height: 1.7;">&#10003; &nbsp;Annotated PDF with issues marked visually</p>
            </td>
          </tr>
        </table>

        <p style="font-size: 14px; line-height: 1.8; color: #6B6151; margin: 0 0 8px;">
          Questions about your file? Just reply — I read every one.
        </p>

        <p style="font-size: 14px; color: #6B6151; margin: 0;">
          Got another manuscript to check?
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
    "Your KDP readiness score is ready.",
    "",
    "I'm Manny. I built manu2print after watching too many solid books get rejected",
    "for things no one warns you about.",
    "",
    "Margins slightly off.",
    "Bleed missing.",
    "Fonts not embedded.",
    "",
    "You only find out after you upload… wait… and get the rejection.",
    "",
    "That's usually when people start looking for answers.",
    "That's why you're here.",
    "",
    "Your PDF has been scanned. The full report shows you exactly what's flagged,",
    "which pages are affected, and what to fix — before you submit to KDP.",
    "",
    `See your full report — $9: ${downloadUrl}`,
    "",
    "Your full report includes:",
    "✓ Every issue flagged — bleed, margins, fonts, image resolution",
    "✓ Exact page numbers for every problem",
    "✓ Plain-English fix for each issue",
    "✓ Annotated PDF with issues marked visually",
    "",
    "Questions about your file? Just reply — I read every one.",
    "",
    `Got another manuscript to check? ${checkerUrl}`,
    "",
    "— Manny, manu2print.com",
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: WELCOME_EMAIL_SUBJECT,
    html,
    text,
  });

  if (error) throw error;
  await logEmailSend({
    recipientEmail: to,
    eventType: "welcome",
    subject: WELCOME_EMAIL_SUBJECT,
    resendMessageId: data?.id,
  });
  return data;
}

export async function sendAnnotatedPdfReadyEmail(to: string, annotatedUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const safeUrl = escapeHtmlAttr(annotatedUrl);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const toolsUrl = `${appUrl}/#tools`;
  const affiliateUrl = `${appUrl}/partners`;

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:24px;font-weight:900;margin:0 0 12px;"><span style="color:#F05A28;">manu</span><span style="color:#4cd964;">2print</span></p>
  <p style="font-size:22px;font-weight:800;margin:0 0 10px;">Your annotated PDF is ready.</p>
  <p style="font-size:15px;line-height:1.7;color:#3a3020;margin:0 0 18px;">You can download the highlighted file now and fix issues page by page.</p>
  <p style="margin:0 0 22px;">
    <a href="${safeUrl}" style="background:#F05A28;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:800;display:inline-block;">Download Annotated PDF →</a>
  </p>
  <p style="font-size:13px;color:#6B6151;line-height:1.6;margin:0 0 18px;">⚠️ <strong>This link expires in ${Math.round(DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS / 3600)} hours</strong> — download and save the PDF to your computer.</p>
  <p style="font-size:14px;color:#6B6151;line-height:1.7;margin:0 0 4px;">Want more? Try our free tools: <a href="${toolsUrl}" style="color:#F05A28;">manu2print.com</a></p>
  <p style="font-size:14px;color:#6B6151;line-height:1.7;margin:0;">Love the product? Become an affiliate: <a href="${affiliateUrl}" style="color:#F05A28;">Join here</a></p>
</body></html>`.trim();

  const text = [
    "Your annotated PDF is ready.",
    "",
    `Download: ${annotatedUrl}`,
    "",
    `This link expires in ${Math.round(DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS / 3600)} hours — save the PDF to your computer.`,
    "",
    `Try our free tools: ${toolsUrl}`,
    `Become an affiliate: ${affiliateUrl}`,
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject: ANNOTATED_PDF_SUBJECT,
    html,
    text,
  });
  if (error) throw error;
  return data;
}

/** Lifecycle / marketing emails (Manny + reply-to; appends unsubscribe footer to text if missing). */
export async function sendMarketingHtmlEmail(
  to: string,
  subject: string,
  html: string,
  textBody: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "");
  const text = textBody.trim().toLowerCase().includes("unsubscribe")
    ? textBody
    : `${textBody}\n\n${MARKETING_UNSUBSCRIBE_FOOTER_TEXT}`;
  const { data, error } = await resend.emails.send({
    from: FROM_MANNY,
    replyTo: REPLY_TO,
    to,
    subject,
    html,
    text,
  });
  if (error) throw error;
  return data;
}
