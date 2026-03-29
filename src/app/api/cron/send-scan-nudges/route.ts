import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

async function alertCronFailure(reason: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");
    await resend.emails.send({
      from: "noreply@manu2print.com",
      to: "hello@manu2print.com",
      subject: `⚠️ Cron failure: send-scan-nudges — ${new Date().toISOString().slice(0, 10)}`,
      text: `The daily scan-nudge cron failed.\n\nReason: ${reason}\n\nCheck Vercel logs immediately.\n\n— manu2print cron monitor`,
    });
  } catch { /* ignore — Vercel logs still capture the error */ }
}

function isAuthorized(req: NextRequest): boolean {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return auth === `Bearer ${secret}`;
}

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend   = new Resend(process.env.RESEND_API_KEY ?? "");
  const baseUrl  = process.env.NEXT_PUBLIC_APP_URL || "https://www.manu2print.com";

  // Fetch unsent nudges older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: nudges, error } = await supabase
    .from("scan_nudges")
    .select("id, email, download_id")
    .is("sent_at", null)
    .lt("created_at", cutoff)
    .limit(100);

  if (error) {
    console.error("[cron/send-scan-nudges] fetch error:", error);
    await alertCronFailure(`DB fetch failed: ${error.message}`);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  if (!nudges || nudges.length === 0) {
    return NextResponse.json({ sent: 0, message: "Nothing to send" });
  }

  let sent = 0;
  let errors = 0;

  for (const nudge of nudges) {
    const downloadUrl = `${baseUrl}/download/${nudge.download_id}?source=nudge`;

    try {
      await resend.emails.send({
        from: "noreply@manu2print.com",
        to: nudge.email,
        subject: "Your KDP report is still waiting — manu2print",
        html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:22px;font-weight:900;margin:0 0 8px;">
    <span style="color:#F05A28;">manu</span><span style="color:#2D6A2D;">2print</span>
  </p>
  <hr style="border:none;border-top:2px solid rgba(0,0,0,0.07);margin:16px 0 24px;" />

  <h1 style="font-size:22px;font-weight:800;margin:0 0 12px;line-height:1.25;">
    Your PDF report is still waiting.
  </h1>
  <p style="font-size:15px;color:#6B6151;line-height:1.6;margin:0 0 20px;">
    You scanned your manuscript yesterday and found issues — but never unlocked the full report.
    The annotated PDF and fix instructions are still here for you.
  </p>
  <p style="font-size:15px;color:#6B6151;line-height:1.6;margin:0 0 28px;">
    For $9 you get every issue flagged by page, exactly how to fix it, and an annotated PDF
    to work from — so you upload once and KDP accepts it.
  </p>

  <a href="${downloadUrl}"
     style="display:inline-block;background:#F05A28;color:#fff;font-weight:800;font-size:16px;
            padding:16px 32px;border-radius:12px;text-decoration:none;margin-bottom:28px;">
    Unlock my report — $9 →
  </a>

  <p style="font-size:13px;color:#9B8E7E;line-height:1.6;margin:0 0 8px;">
    Most files fail on margins, bleed, or font embedding — issues that cause instant KDP rejection.
    Takes 2 minutes to fix once you know what they are.
  </p>

  <hr style="border:none;border-top:1px solid #E0D8C4;margin:24px 0 16px;" />
  <p style="font-size:12px;color:#C4B5A0;margin:0;">
    © manu2print.com · You received this because you scanned a manuscript.<br/>
    <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(nudge.email)}" style="color:#C4B5A0;">Unsubscribe</a>
  </p>
</body></html>`.trim(),
        text: `Your KDP report is still waiting.\n\nUnlock it here: ${downloadUrl}\n\n$9 · Fix every issue before Amazon rejects your file.\n\n— manu2print.com`,
      });

      // Mark as sent
      await supabase
        .from("scan_nudges")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", nudge.id);

      sent++;
    } catch (err) {
      console.error(`[cron/send-scan-nudges] failed for ${nudge.email}:`, err);
      errors++;
    }
  }

  console.log(`[cron/send-scan-nudges] done — sent: ${sent}, errors: ${errors}`);
  if (errors > 0) {
    await alertCronFailure(`${errors} of ${nudges.length} nudge emails failed to send. Check Vercel logs.`);
  }
  return NextResponse.json({ sent, errors, total: nudges.length });
}
