import { checkerDeliveryLink } from "./checkerCapability";
import { getStored, normalizeAnnotatedPdfStatus, updateAnnotatedState } from "./storage";
import { sendAnnotatedPdfReadyEmail } from "./resend";
import { supabase } from "./supabase";
import { logEmailSend } from "./logEmailSend";
import { ANNOTATED_PDF_SUBJECT } from "./emailSubjects";

/** Abandoned pending claims (crash after INSERT, before Resend) can be reclaimed after this. */
const STALE_PENDING_MS = 10 * 60 * 1000;

/**
 * Postgres claim before Resend: avoids duplicate sends under concurrent callers.
 * Retries allowed for status=failed with null resend_message_id; stale pending rows reclaimed.
 */
async function claimAnnotatedSend(downloadId: string, recipientEmail: string): Promise<boolean> {
  const staleBefore = new Date(Date.now() - STALE_PENDING_MS).toISOString();

  const { error: insertError } = await supabase.from("annotated_email_sends").insert({
    download_id: downloadId,
    status: "pending",
    recipient_email: recipientEmail,
  });

  if (!insertError) return true;

  if (insertError.code !== "23505") {
    console.error("[annotatedEmail] claim insert error:", insertError);
    return false;
  }

  const { data: reclaimedFailed } = await supabase
    .from("annotated_email_sends")
    .update({
      status: "pending",
      error: null,
      resend_message_id: null,
      recipient_email: recipientEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("download_id", downloadId)
    .eq("status", "failed")
    .is("resend_message_id", null)
    .select("id")
    .maybeSingle();

  if (reclaimedFailed?.id) return true;

  const { data: reclaimedStale } = await supabase
    .from("annotated_email_sends")
    .update({
      status: "pending",
      error: "recovered_stale_claim",
      resend_message_id: null,
      recipient_email: recipientEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("download_id", downloadId)
    .eq("status", "pending")
    .lt("created_at", staleBefore)
    .select("id")
    .maybeSingle();

  return !!reclaimedStale?.id;
}

export async function sendAnnotatedEmailIfReady(downloadId: string): Promise<boolean> {
  const meta = await getStored(downloadId);
  if (!meta?.payment_confirmed) return false;
  if (!meta.annotatedEmail) return false;
  if (meta.annotatedEmailSentAt) return false;
  if (normalizeAnnotatedPdfStatus(meta.annotatedPdfStatus, meta.annotatedEmailSentAt) !== "ready") {
    return false;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[annotatedEmail] Supabase not configured — cannot claim send");
    return false;
  }

  // Old metadata may contain an address supplied before access checks existed.
  const { data: purchase, error: purchaseError } = await supabase.from("payments").select("id")
    .eq("email", meta.annotatedEmail.trim().toLowerCase()).eq("status", "complete")
    .or(`download_id.eq.${downloadId},and(gateway.eq.credits,gateway_order_id.eq.${downloadId})`).limit(1);
  if (purchaseError || !purchase?.length) return false;
  const claimed = await claimAnnotatedSend(downloadId, meta.annotatedEmail);
  if (!claimed) return false;

  const annotatedUrl = checkerDeliveryLink(downloadId);

  let messageId: string | undefined;
  let sendError: string | undefined;

  try {
    const result = await sendAnnotatedPdfReadyEmail(meta.annotatedEmail, annotatedUrl);
    messageId = result?.id ?? undefined;
    await supabase
      .from("annotated_email_sends")
      .update({
        status: "sent",
        resend_message_id: messageId ?? null,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("download_id", downloadId);

    await updateAnnotatedState(downloadId, { status: "delivered", markSent: true });

    await logEmailSend({
      recipientEmail: meta.annotatedEmail,
      eventType: "annotated_pdf",
      subject: ANNOTATED_PDF_SUBJECT,
      resendMessageId: messageId,
      metadata: { download_id: downloadId },
    });
    return true;
  } catch (e) {
    sendError = e instanceof Error ? e.message : String(e);
    await supabase
      .from("annotated_email_sends")
      .update({
        status: "failed",
        error: sendError,
        updated_at: new Date().toISOString(),
      })
      .eq("download_id", downloadId);

    await logEmailSend({
      recipientEmail: meta.annotatedEmail,
      eventType: "annotated_pdf",
      subject: ANNOTATED_PDF_SUBJECT,
      error: sendError,
      metadata: { download_id: downloadId },
    });
    throw e;
  }
}
