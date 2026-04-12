import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAllPosts } from "@/lib/blog";
import { generateBlogNotificationEmail } from "@/lib/emailGenerators/blogNotificationEmail";
import { sendMarketingHtmlEmail } from "@/lib/resend";
import { logEmailSend } from "@/lib/logEmailSend";
import { alertCronFailure } from "@/lib/cronAdminAlert";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    await alertCronFailure("send-blog-notifications", "Supabase env missing");
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const supabase = createClient(url, key);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";

  const posts = getAllPosts().filter((p) => {
    if (p.notified === true) return false;
    const pub = new Date(p.publishedAt);
    return pub.getTime() <= today.getTime();
  });

  let postsNotified = 0;
  let emailsSent = 0;

  for (const post of posts) {
    const { data: existing } = await supabase
      .from("blog_notification_log")
      .select("slug")
      .eq("slug", post.slug)
      .maybeSingle();
    if (existing) continue;

    const { data: subs, error: subErr } = await supabase
      .from("platform_notifications")
      .select("email")
      .eq("notify_all", true);

    if (subErr) {
      console.error("[cron/send-blog-notifications] subs:", subErr);
      await alertCronFailure("send-blog-notifications", subErr.message);
      continue;
    }

    const recipients = (subs ?? [])
      .map((s) => s.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e?.includes("@")));

    if (recipients.length === 0) {
      await supabase.from("blog_notification_log").upsert(
        { slug: post.slug, recipient_count: 0 },
        { onConflict: "slug" }
      );
      postsNotified++;
      continue;
    }

    try {
      const { subject, html } = await generateBlogNotificationEmail({
        postTitle: post.title,
        postSlug: post.slug,
        postExcerpt: post.excerpt,
        appUrl,
      });

      let count = 0;
      for (const email of recipients) {
        try {
          const text = `${subject}\n\nRead: ${appUrl.replace(/\/$/, "")}/blog/${post.slug}\n\nYou're receiving this because you used manu2print.com — unsubscribe at https://www.manu2print.com/unsubscribe`;
          const res = await sendMarketingHtmlEmail(email, subject, html, text);
          count++;
          await logEmailSend({
            recipientEmail: email,
            eventType: "blog_notification",
            subject,
            resendMessageId: res?.id,
            metadata: { slug: post.slug },
          });
        } catch (e) {
          console.error("[cron/send-blog-notifications] send:", email, e);
        }
      }

      await supabase.from("blog_notification_log").upsert(
        { slug: post.slug, recipient_count: count },
        { onConflict: "slug" }
      );
      emailsSent += count;
      postsNotified++;
    } catch (e) {
      console.error("[cron/send-blog-notifications] post:", post.slug, e);
    }
  }

  return NextResponse.json({ ok: true, postsNotified, emailsSent });
}
