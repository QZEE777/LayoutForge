import { Resend } from "resend";
import { DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS } from "./r2Storage";
import { logEmailSend } from "./logEmailSend";
import {
  ANNOTATED_PDF_SUBJECT,
  downloadLinkReportSubject,
  packPurchaseSubject,
  WELCOME_EMAIL_SUBJECT,
} from "./emailSubjects";
import { MARKETING_UNSUBSCRIBE_FOOTER_TEXT } from "./emailMarketingFooter";

const FROM         = "noreply@manu2print.com";
const FROM_MANNY   = "Manny | manu2print <manny@manu2print.com>";
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
  const safeAnnotatedUrl = annotatedPdfUrl ? escapeHtmlAttr(annotatedPdfUrl) : null;
  const subjectLine = downloadLinkReportSubject();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 0; background: #FAF7EE; color: #1A1208;">

  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">

    <!-- Header -->
    <tr>
      <td style="background: #1A1208; padding: 20px 32px; border-radius: 12px 12px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align: middle;">
              <span style="font-size: 24px; font-weight: 700; color: #F05A28;">manu</span><span style="font-size: 24px; font-weight: 700; color: #4cd964;">2print</span>
            </td>
            <td align="right" style="vertical-align: middle;">
              <img src="https://www.manu2print.com/MANNY%20AVATAR.png" alt="Manny" width="40" height="40" style="border-radius: 50%; display: block;" />
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 36px 32px 24px; background: #FAF7EE;">

        <p style="font-size: 22px; font-weight: 700; color: #1A1208; margin: 0 0 16px; line-height: 1.3;">
          You&rsquo;re in. Your annotated PDF is ready.
        </p>

        <p style="font-size: 15px; line-height: 1.8; color: #3a3020; margin: 0 0 24px;">
          Your manuscript has been checked against KDP requirements. Every issue is marked directly on your pages so you can fix it before uploading.
        </p>

        ${safeAnnotatedUrl ? `
        <p style="font-size: 12px; font-weight: 700; color: #6B6151; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px;">Your annotated manuscript</p>
        <table cellpadding="0" cellspacing="0" style="margin: 0 0 8px; width: 100%;">
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
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 28px;">Your uploaded file with every issue clearly marked on the page.</p>
        ` : ""}

        <!-- What's inside -->
        <table width="100%" cellpadding="0" cellspacing="0"
               style="background: #fff; border-radius: 10px; border: 1px solid #E0D8C4; margin: 0 0 24px;">
          <tr>
            <td style="padding: 20px 24px;">
              <p style="font-size: 13px; font-weight: 700; color: #1A1208; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                What&rsquo;s inside your annotated PDF
              </p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Every formatting issue flagged &mdash; margins, bleed, fonts, image resolution</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Exact page numbers for each issue</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0 0 8px; line-height: 1.7;">&#10003; &nbsp;Clear, plain-English fix guidance</p>
              <p style="font-size: 14px; color: #3a3020; margin: 0; line-height: 1.7;">&#10003; &nbsp;Issues shown directly on your pages for fast correction</p>
            </td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #6B6151; margin: 0 0 16px;">
          &#128278; <strong>Bookmark this email</strong> &mdash; your file stays available anytime.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; border-top: 1px solid #E0D8C4; background: #FAF7EE;">
        <p style="font-size: 12px; color: #9B8E7E; margin: 0 0 2px;">— Manny</p>
        <p style="font-size: 11px; color: #C4B9AC; margin: 0;">manu2print.com &nbsp;|&nbsp; Built for indie authors who want to publish without setbacks.</p>
      </td>
    </tr>

  </table>

</body>
</html>
`.trim();

  const text = [
    "You're in. Your annotated PDF is ready.",
    "",
    "Your manuscript has been checked against KDP requirements. Every issue is marked directly on your pages so you can fix it before uploading.",
    "",
    ...(annotatedPdfUrl
      ? [
          "Download your annotated PDF:",
          annotatedPdfUrl,
          "",
        ]
      : []),
    "What's inside your annotated PDF:",
    "✓ Every formatting issue flagged — margins, bleed, fonts, image resolution",
    "✓ Exact page numbers for each issue",
    "✓ Clear, plain-English fix guidance",
    "✓ Issues shown directly on your pages for fast correction",
    "",
    "Bookmark this email — your file stays available anytime.",
    "",
    "— Manny",
    "manu2print.com | Built for indie authors who want to publish without setbacks.",
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
    metadata: { has_first_name: Boolean(name) },
  });
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
  <p style="font-size:14px;color:#6B6151;line-height:1.7;margin:0;">Want more? Try our free tools: <a href="${toolsUrl}" style="color:#F05A28;">manu2print.com</a></p>
</body></html>`.trim();

  const text = [
    "Your annotated PDF is ready.",
    "",
    `Download: ${annotatedUrl}`,
    "",
    `This link expires in ${Math.round(DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS / 3600)} hours — save the PDF to your computer.`,
    "",
    `Try our free tools: ${toolsUrl}`,
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
