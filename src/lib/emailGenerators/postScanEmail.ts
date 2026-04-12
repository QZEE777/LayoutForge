import { haikuJsonResponse } from "./anthropicHaikuJson";
import { marketingUnsubscribeFooterHtml } from "../emailMarketingFooter";

const SYSTEM = `You are Manny, the manu2print mascot. You write short, warm, slightly humorous emails to indie authors about their KDP PDF scan results. You are encouraging but honest. Never more than 150 words in the email body. Always end with a clear CTA.

Respond with JSON only, no markdown, in this exact shape:
{"subject":"...","body":"..."}

The body is plain text (no HTML tags).`;

export type PostScanEmailContext = {
  score: number;
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  topIssues: string[];
  downloadId: string;
  appUrl: string;
};

function wrapEmailHtml(bodyPlain: string, downloadId: string, appUrl: string): string {
  const safeUrl = `${appUrl.replace(/\/$/, "")}/download/${encodeURIComponent(downloadId)}`;
  const paras = bodyPlain
    .split(/\n\n+/)
    .map((p) => `<p style="font-size:15px;line-height:1.7;color:#3a3020;margin:0 0 14px;">${escapeHtml(p.replace(/\n/g, " "))}</p>`)
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:24px;font-weight:900;margin:0 0 12px;"><span style="color:#F05A28;">manu</span><span style="color:#4cd964;">2print</span></p>
  ${paras}
  <p style="margin:20px 0 8px;">
    <a href="${safeUrl}" style="background:#F05A28;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:800;display:inline-block;">View My Full Report →</a>
  </p>
  ${marketingUnsubscribeFooterHtml()}
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function generatePostScanEmail(
  context: PostScanEmailContext
): Promise<{ subject: string; html: string }> {
  const user = `Write the nurture email. Context JSON:\n${JSON.stringify(
    {
      score: context.score,
      issueCount: context.issueCount,
      criticalCount: context.criticalCount,
      warningCount: context.warningCount,
      topIssues: context.topIssues.slice(0, 3),
    },
    null,
    2
  )}\n\nThe CTA should encourage unlocking the full report; the button will link to the download page — you do not need to paste the URL in the body.`;

  const parsed = await haikuJsonResponse<{ subject: string; body: string }>(SYSTEM, user);
  if (!parsed.subject || !parsed.body) throw new Error("Missing subject or body from Haiku");

  const html = wrapEmailHtml(parsed.body, context.downloadId, context.appUrl);
  return { subject: parsed.subject.trim(), html };
}
