import { haikuJsonResponse } from "./anthropicHaikuJson";
import { marketingUnsubscribeFooterHtml } from "../emailMarketingFooter";

const SYSTEM = `You are Manny from manu2print. Write a warm 24-hour follow-up email to an indie author who paid for a KDP compliance report. Encourage them to re-upload if they fixed issues. Mention the affiliate program (40% commission) at manu2print.com/partners/apply. Never more than 180 words. End with two clear CTAs: re-check their PDF at the checker, and explore the affiliate program.

Respond with JSON only, no markdown, in this exact shape:
{"subject":"...","body":"..."}

The body is plain text (no HTML tags).`;

export type PostPurchaseEmailContext = {
  buyerName: string;
  score: number;
  issueCount: number;
  downloadId: string;
  purchaseDate: string;
  appUrl: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmailHtml(bodyPlain: string, downloadId: string, appUrl: string): string {
  const base = appUrl.replace(/\/$/, "");
  const checkerUrl = `${base}/kdp-pdf-checker`;
  const affiliateUrl = `${base}/partners/apply`;
  const paras = bodyPlain
    .split(/\n\n+/)
    .map((p) => `<p style="font-size:15px;line-height:1.7;color:#3a3020;margin:0 0 14px;">${escapeHtml(p.replace(/\n/g, " "))}</p>`)
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:24px;font-weight:900;margin:0 0 12px;"><span style="color:#F05A28;">manu</span><span style="color:#4cd964;">2print</span></p>
  ${paras}
  <p style="margin:20px 0 8px;">
    <a href="${checkerUrl}" style="background:#F05A28;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:800;display:inline-block;margin-right:8px;">Re-check my PDF →</a>
    <a href="${affiliateUrl}" style="background:#1A1208;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:800;display:inline-block;">Affiliate program →</a>
  </p>
  <p style="font-size:13px;color:#6B6151;margin:12px 0 0;"><a href="${base}/download/${encodeURIComponent(downloadId)}" style="color:#F05A28;">View your report again →</a></p>
  ${marketingUnsubscribeFooterHtml()}
</body></html>`;
}

export async function generatePostPurchaseEmail(
  context: PostPurchaseEmailContext
): Promise<{ subject: string; html: string }> {
  const user = `Write the follow-up email. Context JSON:\n${JSON.stringify(
    {
      buyerName: context.buyerName,
      score: context.score,
      issueCount: context.issueCount,
      downloadId: context.downloadId,
      purchaseDate: context.purchaseDate,
    },
    null,
    2
  )}`;

  const parsed = await haikuJsonResponse<{ subject: string; body: string }>(SYSTEM, user);
  if (!parsed.subject || !parsed.body) throw new Error("Missing subject or body from Haiku");

  return {
    subject: parsed.subject.trim(),
    html: wrapEmailHtml(parsed.body, context.downloadId, context.appUrl),
  };
}
