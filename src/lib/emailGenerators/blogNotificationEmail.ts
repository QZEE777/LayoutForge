import { haikuJsonResponse } from "./anthropicHaikuJson";
import { marketingUnsubscribeFooterHtml } from "../emailMarketingFooter";

const SYSTEM = `You are Manny from manu2print. Write a short, enthusiastic email telling KDP authors about a new blog post. Max 100 words. Include the post title and a single CTA to read it. Warm and direct — no fluff.

Respond with JSON only, no markdown, in this exact shape:
{"subject":"...","body":"..."}

The body is plain text (no HTML tags).`;

export type BlogNotificationEmailContext = {
  postTitle: string;
  postSlug: string;
  postExcerpt: string;
  appUrl: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function generateBlogNotificationEmail(
  context: BlogNotificationEmailContext
): Promise<{ subject: string; html: string }> {
  const user = `Context JSON:\n${JSON.stringify(
    {
      postTitle: context.postTitle,
      postSlug: context.postSlug,
      postExcerpt: context.postExcerpt,
    },
    null,
    2
  )}`;

  const parsed = await haikuJsonResponse<{ subject: string; body: string }>(SYSTEM, user);
  if (!parsed.subject || !parsed.body) throw new Error("Missing subject or body from Haiku");

  const base = context.appUrl.replace(/\/$/, "");
  const postUrl = `${base}/blog/${encodeURIComponent(context.postSlug)}`;
  const paras = parsed.body
    .split(/\n\n+/)
    .map((p) => `<p style="font-size:15px;line-height:1.7;color:#3a3020;margin:0 0 14px;">${escapeHtml(p.replace(/\n/g, " "))}</p>`)
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:24px;font-weight:900;margin:0 0 12px;"><span style="color:#F05A28;">manu</span><span style="color:#4cd964;">2print</span></p>
  ${paras}
  <p style="margin:20px 0 8px;">
    <a href="${postUrl}" style="background:#F05A28;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:800;display:inline-block;">Read the post →</a>
  </p>
  ${marketingUnsubscribeFooterHtml()}
</body></html>`;

  return { subject: parsed.subject.trim(), html };
}
