import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStored } from "@/lib/storage";
import { generatePostPurchaseEmail } from "@/lib/emailGenerators/postPurchaseEmail";
import { sendMarketingHtmlEmail } from "@/lib/resend";
import { logEmailSend } from "@/lib/logEmailSend";
import { alertCronFailure } from "@/lib/cronAdminAlert";

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    await alertCronFailure("send-post-purchase-emails", "Supabase env missing");
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const supabase = createClient(url, key);
  const now = Date.now();
  const anchorMax = new Date(now - 23 * 60 * 60 * 1000).toISOString();
  const anchorMin = new Date(now - 27 * 60 * 60 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("payments")
    .select("id, email, download_id, download_ttl_anchor_at")
    .eq("status", "complete")
    .eq("payment_type", "single_use")
    .eq("post_purchase_email_sent", false)
    .not("download_id", "is", null)
    .not("download_ttl_anchor_at", "is", null)
    .lte("download_ttl_anchor_at", anchorMax)
    .gt("download_ttl_anchor_at", anchorMin);

  if (error) {
    console.error("[cron/send-post-purchase-emails] fetch:", error);
    await alertCronFailure("send-post-purchase-emails", error.message);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";
  let sent = 0;
  let skipped = 0;

  for (const row of rows ?? []) {
    const email = row.email?.trim().toLowerCase();
    const downloadId = row.download_id as string;
    if (!email?.includes("@") || !downloadId) {
      skipped++;
      continue;
    }

    try {
      const meta = await getStored(downloadId);
      const score = meta?.processingReport?.readinessScore100 ?? 0;
      const issueCount =
        meta?.processingReport?.issuesEnriched?.length ??
        meta?.processingReport?.page_issues?.length ??
        0;
      const buyerName =
        (meta?.buyerName?.trim() || email.split("@")[0] || "there").slice(0, 80);
      const purchaseDate =
        typeof row.download_ttl_anchor_at === "string"
          ? row.download_ttl_anchor_at
          : new Date().toISOString();

      const { subject, html } = await generatePostPurchaseEmail({
        buyerName,
        score,
        issueCount,
        downloadId,
        purchaseDate,
        appUrl,
      });

      const text = `${subject}\n\nYou're receiving this because you used manu2print.com — unsubscribe at https://www.manu2print.com/unsubscribe`;

      const res = await sendMarketingHtmlEmail(email, subject, html, text);
      await supabase
        .from("payments")
        .update({ post_purchase_email_sent: true })
        .eq("id", row.id);

      await logEmailSend({
        recipientEmail: email,
        eventType: "post_purchase",
        subject,
        resendMessageId: res?.id,
        metadata: { payment_id: row.id, download_id: downloadId },
      });
      sent++;
    } catch (e) {
      console.error("[cron/send-post-purchase-emails] row:", row.id, e);
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, scanned: (rows ?? []).length, sent, skipped });
}
