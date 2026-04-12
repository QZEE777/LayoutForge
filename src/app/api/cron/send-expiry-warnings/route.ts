import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS } from "@/lib/r2Storage";
import { sendMarketingHtmlEmail } from "@/lib/resend";
import { logEmailSend } from "@/lib/logEmailSend";
import { EXPIRY_WARNING_SUBJECT } from "@/lib/emailSubjects";
import { marketingUnsubscribeFooterHtml } from "@/lib/emailMarketingFooter";
import { alertCronFailure } from "@/lib/cronAdminAlert";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

/** Warning fires ~2h before the 24h promised window from download_ttl_anchor_at ends. */
const WARNING_BEFORE_SEC = 2 * 60 * 60;

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    await alertCronFailure("send-expiry-warnings", "Supabase env missing");
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const supabase = createClient(url, key);
  const now = Date.now();
  const warnAtSec = DOWNLOAD_SIGNED_URL_EXPIRES_SECONDS - WARNING_BEFORE_SEC;
  // Fire when (anchor + warnAt) is in the last ~1h: anchor between (now - warnAt - 3600s) and (now - warnAt).
  const anchorYoung = new Date(now - (warnAtSec + 3600) * 1000).toISOString();
  const anchorOld = new Date(now - warnAtSec * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("payments")
    .select("id, email, download_id, download_ttl_anchor_at")
    .eq("status", "complete")
    .eq("payment_type", "single_use")
    .eq("expiry_warning_sent", false)
    .not("download_id", "is", null)
    .not("download_ttl_anchor_at", "is", null)
    .not("email", "is", null)
    .gt("download_ttl_anchor_at", anchorYoung)
    .lte("download_ttl_anchor_at", anchorOld);

  if (error) {
    console.error("[cron/send-expiry-warnings] fetch:", error);
    await alertCronFailure("send-expiry-warnings", error.message);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  const base = appUrl.replace(/\/$/, "");
  let sent = 0;

  for (const row of rows ?? []) {
    const email = row.email?.trim().toLowerCase();
    const downloadId = row.download_id as string;
    if (!email?.includes("@") || !downloadId) continue;

    const downloadUrl = `${base}/download/${encodeURIComponent(downloadId)}`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:24px;font-weight:900;margin:0 0 12px;"><span style="color:#F05A28;">manu</span><span style="color:#4cd964;">2print</span></p>
  <p style="font-size:17px;font-weight:700;margin:0 0 12px;">Your KDP PDF compliance report is expiring soon.</p>
  <p style="font-size:15px;line-height:1.7;color:#3a3020;margin:0 0 18px;">Download it now before the link expires.</p>
  <p style="margin:0 0 18px;">
    <a href="${downloadUrl}" style="background:#F05A28;color:#fff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:800;display:inline-block;">Download My Report →</a>
  </p>
  <p style="font-size:14px;color:#6B6151;line-height:1.6;margin:0 0 8px;">After expiry, re-run a scan at <a href="${base}/kdp-pdf-checker" style="color:#F05A28;">manu2print.com/kdp-pdf-checker</a>.</p>
  ${marketingUnsubscribeFooterHtml()}
</body></html>`;

    const text = [
      "Your KDP PDF compliance report is expiring soon. Download it now before the link expires.",
      "",
      downloadUrl,
      "",
      `After expiry, re-run a scan at ${base}/kdp-pdf-checker`,
      "",
      "You're receiving this because you used manu2print.com — unsubscribe at https://www.manu2print.com/unsubscribe",
    ].join("\n");

    try {
      const res = await sendMarketingHtmlEmail(email, EXPIRY_WARNING_SUBJECT, html, text);
      await supabase.from("payments").update({ expiry_warning_sent: true }).eq("id", row.id);
      await logEmailSend({
        recipientEmail: email,
        eventType: "expiry_warning",
        subject: EXPIRY_WARNING_SUBJECT,
        resendMessageId: res?.id,
        metadata: { payment_id: row.id, download_id: downloadId },
      });
      sent++;
    } catch (e) {
      console.error("[cron/send-expiry-warnings] send:", row.id, e);
    }
  }

  return NextResponse.json({ ok: true, scanned: (rows ?? []).length, sent });
}
