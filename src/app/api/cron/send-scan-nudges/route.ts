import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";
import { cronFailureEmailSubject, SCAN_NUDGE_SUBJECT } from "@/lib/emailSubjects";

async function alertCronFailure(reason: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY ?? "");
    await resend.emails.send({
      from: "noreply@manu2print.com",
      to: "hello@manu2print.com",
      subject: cronFailureEmailSubject(
        "send-scan-nudges",
        new Date().toISOString().slice(0, 10)
      ),
      text: `The daily scan-nudge cron failed.\n\nReason: ${reason}\n\nCheck Vercel logs immediately.\n\n— manu2print cron monitor`,
    });
  } catch { /* ignore — Vercel logs still capture the error */ }
}

function isAuthorized(req: NextRequest): boolean {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = `Bearer ${secret}`;
  try {
    return auth.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  } catch {
    return false;
  }
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
  const resend  = new Resend(process.env.RESEND_API_KEY ?? "");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.manu2print.com";

  let totalSent   = 0;
  let totalErrors = 0;

  // ── PASS 1 — Email 1: 24h after scan, not yet nudged ─────────────────────
  const cutoff1 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: nudges1, error: error1 } = await supabase
    .from("scan_nudges")
    .select("id, email, download_id")
    .is("sent_at", null)
    .is("converted_at", null)
    .not("email", "is", null)
    .neq("email", "")
    .lt("created_at", cutoff1)
    .limit(100);

  if (error1) {
    console.error("[cron/send-scan-nudges] pass1 fetch error:", error1);
    await alertCronFailure(`Pass 1 DB fetch failed: ${error1.message}`);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  for (const nudge of nudges1 ?? []) {
    const downloadUrl = `${baseUrl}/download/${nudge.download_id}?source=nudge`;
    try {
      await resend.emails.send({
        from: "noreply@manu2print.com",
        to: nudge.email,
        subject: SCAN_NUDGE_SUBJECT,
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

      await supabase
        .from("scan_nudges")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", nudge.id);

      totalSent++;
    } catch (err) {
      console.error(`[cron/send-scan-nudges] pass1 failed for ${nudge.email}:`, err);
      totalErrors++;
    }
  }

  // ── PASS 2 — Email 2: 48h after Email 1, educational ─────────────────────
  const cutoff2 = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: nudges2, error: error2 } = await supabase
    .from("scan_nudges")
    .select("id, email, download_id")
    .not("sent_at", "is", null)
    .lte("sent_at", cutoff2)
    .is("nudge_2_sent_at", null)
    .is("converted_at", null)
    .not("email", "is", null)
    .neq("email", "")
    .limit(100);

  if (error2) {
    console.error("[cron/send-scan-nudges] pass2 fetch error:", error2);
    await alertCronFailure(`Pass 2 DB fetch failed: ${error2.message}`);
  } else {
    for (const nudge of nudges2 ?? []) {
      const downloadUrl = `${baseUrl}/download/${nudge.download_id}?source=nudge2`;
      try {
        await resend.emails.send({
          from: "noreply@manu2print.com",
          to: nudge.email,
          subject: "What KDP is actually checking (and why most files fail)",
          html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:22px;font-weight:900;margin:0 0 8px;">
    <span style="color:#F05A28;">manu</span><span style="color:#2D6A2D;">2print</span>
  </p>
  <hr style="border:none;border-top:2px solid rgba(0,0,0,0.07);margin:16px 0 24px;" />
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;">Most files don't fail because they're bad.</p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;">They fail because of three invisible checks.</p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;"><strong>Margins.<br/>Bleed.<br/>Fonts.</strong></p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;">KDP reads those before it reads a single word.</p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;">We've seen thousands of PDFs.<br/>Canva exports alone usually miss at least one.</p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;">Not obvious. Not visible.<br/>But enough to trigger rejection.</p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 28px;">Your scan already mapped this out — where it passes, where it breaks.</p>
  <a href="${downloadUrl}"
     style="display:inline-block;background:#F05A28;color:#fff;font-weight:800;font-size:16px;
            padding:16px 32px;border-radius:12px;text-decoration:none;margin-bottom:28px;">
    See my report — $9 →
  </a>
  <hr style="border:none;border-top:1px solid #E0D8C4;margin:24px 0 16px;" />
  <p style="font-size:12px;color:#C4B5A0;margin:0;">
    © manu2print.com · You received this because you scanned a manuscript.<br/>
    <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(nudge.email)}" style="color:#C4B5A0;">Unsubscribe</a>
  </p>
</body></html>`.trim(),
          text: `Most files don't fail because they're bad.\n\nThey fail because of three invisible checks.\n\nMargins. Bleed. Fonts.\n\nKDP reads those before it reads a single word. Your scan already mapped this out.\n\nSee your report: ${downloadUrl}\n\n— manu2print.com`,
        });

        await supabase
          .from("scan_nudges")
          .update({ nudge_2_sent_at: new Date().toISOString() })
          .eq("id", nudge.id);

        totalSent++;
      } catch (err) {
        console.error(`[cron/send-scan-nudges] pass2 failed for ${nudge.email}:`, err);
        totalErrors++;
      }
    }
  }

  // ── PASS 3 — Email 3: 96h after Email 2, urgency/expiry ──────────────────
  const cutoff3 = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();

  const { data: nudges3, error: error3 } = await supabase
    .from("scan_nudges")
    .select("id, email, download_id")
    .not("nudge_2_sent_at", "is", null)
    .lte("nudge_2_sent_at", cutoff3)
    .is("nudge_3_sent_at", null)
    .is("converted_at", null)
    .not("email", "is", null)
    .neq("email", "")
    .limit(100);

  if (error3) {
    console.error("[cron/send-scan-nudges] pass3 fetch error:", error3);
    await alertCronFailure(`Pass 3 DB fetch failed: ${error3.message}`);
  } else {
    for (const nudge of nudges3 ?? []) {
      const downloadUrl = `${baseUrl}/download/${nudge.download_id}?source=nudge3`;
      try {
        await resend.emails.send({
          from: "noreply@manu2print.com",
          to: nudge.email,
          subject: "Your KDP scan expires today",
          html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#FAF7EE;color:#1A1208;">
  <p style="font-size:22px;font-weight:900;margin:0 0 8px;">
    <span style="color:#F05A28;">manu</span><span style="color:#2D6A2D;">2print</span>
  </p>
  <hr style="border:none;border-top:2px solid rgba(0,0,0,0.07);margin:16px 0 24px;" />
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;">We don't keep files.</p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;">After a short window, scan data is cleared.<br/>It's your work. Not ours to hold.</p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 14px;">Your report is still available right now.</p>
  <p style="font-size:15px;color:#3a3020;line-height:1.7;margin:0 0 28px;">After that, it's gone.<br/><br/>If you plan to fix and upload — this is the moment to do it.</p>
  <a href="${downloadUrl}"
     style="display:inline-block;background:#F05A28;color:#fff;font-weight:800;font-size:16px;
            padding:16px 32px;border-radius:12px;text-decoration:none;margin-bottom:28px;">
    Unlock before it's gone — $9 →
  </a>
  <hr style="border:none;border-top:1px solid #E0D8C4;margin:24px 0 16px;" />
  <p style="font-size:12px;color:#C4B5A0;margin:0;">
    © manu2print.com · You received this because you scanned a manuscript.<br/>
    <a href="${baseUrl}/unsubscribe?email=${encodeURIComponent(nudge.email)}" style="color:#C4B5A0;">Unsubscribe</a>
  </p>
</body></html>`.trim(),
          text: `We don't keep files.\n\nAfter a short window, scan data is cleared. It's your work. Not ours to hold.\n\nYour report is still available right now. After that, it's gone.\n\nIf you plan to fix and upload — this is the moment to do it.\n\nUnlock before it's gone: ${downloadUrl}\n\n— manu2print.com`,
        });

        await supabase
          .from("scan_nudges")
          .update({ nudge_3_sent_at: new Date().toISOString() })
          .eq("id", nudge.id);

        totalSent++;
      } catch (err) {
        console.error(`[cron/send-scan-nudges] pass3 failed for ${nudge.email}:`, err);
        totalErrors++;
      }
    }
  }

  console.log(`[cron/send-scan-nudges] done — sent: ${totalSent}, errors: ${totalErrors}`);
  if (totalErrors > 0) {
    await alertCronFailure(`${totalErrors} nudge email(s) failed to send. Check Vercel logs.`);
  }
  return NextResponse.json({ sent: totalSent, errors: totalErrors });
}
