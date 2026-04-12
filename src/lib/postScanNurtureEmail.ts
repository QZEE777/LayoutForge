import { createClient } from "@supabase/supabase-js";
import { getStored } from "./storage";
import { supabase } from "./supabase";
import { generatePostScanEmail } from "./emailGenerators/postScanEmail";
import { sendMarketingHtmlEmail } from "./resend";
import { logEmailSend } from "./logEmailSend";

const STALE_CLAIM_MS = 15 * 60 * 1000;
/** Avoid spawning many parallel jobs while the client polls `done` every few seconds. */
const ENQUEUE_DEBOUNCE_MS = 15_000;
const lastEnqueueAt = new Map<string, number>();

function topIssueLabels(meta: NonNullable<Awaited<ReturnType<typeof getStored>>>): string[] {
  const enriched = meta.processingReport?.issuesEnriched;
  if (enriched?.length) {
    return enriched.slice(0, 3).map((i) => i.humanMessage || i.originalMessage || "Issue");
  }
  const pages = meta.processingReport?.page_issues ?? [];
  return pages.slice(0, 3).map((p) => p.message || p.rule_id || "Formatting issue");
}

function countSeverities(meta: NonNullable<Awaited<ReturnType<typeof getStored>>>): {
  criticalCount: number;
  warningCount: number;
} {
  const pages = meta.processingReport?.page_issues ?? [];
  let critical = 0;
  let warn = 0;
  for (const p of pages) {
    const s = (p.severity ?? "").toLowerCase();
    if (s === "error" || s === "critical") critical++;
    else if (s === "warning") warn++;
  }
  return { criticalCount: critical, warningCount: warn };
}

async function resolveRecipientEmail(
  downloadId: string,
  meta: NonNullable<Awaited<ReturnType<typeof getStored>>>
): Promise<string | null> {
  const lead = meta.leadEmail?.trim().toLowerCase();
  if (lead && lead.includes("@")) return lead;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const sb = createClient(url, key);
  const { data } = await sb
    .from("scan_nudges")
    .select("email")
    .eq("download_id", downloadId)
    .limit(1)
    .maybeSingle();
  const e = data?.email?.trim().toLowerCase();
  if (e && e.includes("@")) return e;
  return null;
}

async function claimPostScanSend(downloadId: string): Promise<boolean> {
  const { error } = await supabase.from("post_scan_email_sends").insert({ download_id: downloadId });
  if (!error) return true;
  if (error.code !== "23505") {
    console.error("[postScanNurtureEmail] claim insert:", error);
    return false;
  }
  const { data: existing } = await supabase
    .from("post_scan_email_sends")
    .select("sent_at, created_at")
    .eq("download_id", downloadId)
    .maybeSingle();
  if (existing?.sent_at) return false;
  if (existing && !existing.sent_at) {
    const created = new Date(existing.created_at).getTime();
    if (Date.now() - created < STALE_CLAIM_MS) return false;
    await supabase.from("post_scan_email_sends").delete().eq("download_id", downloadId);
    const { error: reErr } = await supabase.from("post_scan_email_sends").insert({ download_id: downloadId });
    return !reErr;
  }
  return false;
}

/**
 * Fire-and-forget post-scan nurture email after free checker pipeline completes.
 */
export function enqueuePostScanNurtureEmail(downloadId: string): void {
  const now = Date.now();
  const prev = lastEnqueueAt.get(downloadId) ?? 0;
  if (now - prev < ENQUEUE_DEBOUNCE_MS) return;
  lastEnqueueAt.set(downloadId, now);

  void (async () => {
    try {
      const meta = await getStored(downloadId);
      if (!meta?.processingReport) return;

      const claimed = await claimPostScanSend(downloadId);
      if (!claimed) return;

      const email = await resolveRecipientEmail(downloadId, meta);
      if (!email) {
        await supabase.from("post_scan_email_sends").delete().eq("download_id", downloadId);
        return;
      }

      const score = meta.processingReport?.readinessScore100 ?? 0;
      const pageIssues = meta.processingReport?.page_issues ?? [];
      const issueCount =
        meta.processingReport?.issuesEnriched?.length ?? pageIssues.length ?? 0;
      const { criticalCount, warningCount } = countSeverities(meta);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com";

      const { subject, html } = await generatePostScanEmail({
        score,
        issueCount,
        criticalCount,
        warningCount,
        topIssues: topIssueLabels(meta),
        downloadId,
        appUrl,
      });

      const text = `${subject}\n\nView your full report: ${appUrl.replace(/\/$/, "")}/download/${downloadId}\n\nYou're receiving this because you used manu2print.com — unsubscribe at https://www.manu2print.com/unsubscribe`;

      const sendRes = await sendMarketingHtmlEmail(email, subject, html, text);
      await supabase
        .from("post_scan_email_sends")
        .update({ sent_at: new Date().toISOString() })
        .eq("download_id", downloadId);

      await logEmailSend({
        recipientEmail: email,
        eventType: "post_scan",
        subject,
        resendMessageId: sendRes?.id,
        metadata: { download_id: downloadId, score },
      });
    } catch (e) {
      console.error("[postScanNurtureEmail]", e);
      try {
        await supabase.from("post_scan_email_sends").delete().eq("download_id", downloadId);
      } catch {
        /* ignore */
      }
    }
  })();
}
