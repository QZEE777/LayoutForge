import { supabase } from "./supabase";

export type EmailLogEventType =
  | "download_link"
  | "welcome"
  | "annotated_pdf"
  | "scan_nudge"
  | "otp"
  | "resend_help"
  | "share_credit"
  | "pack_purchase"
  | "partner_threshold"
  | "affiliate_approval"
  | "post_scan"
  | "post_purchase"
  | "blog_notification"
  | "expiry_warning";

export async function logEmailSend(params: {
  recipientEmail: string;
  eventType: EmailLogEventType;
  subject?: string;
  resendMessageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await supabase.from("email_log").insert({
      recipient_email: params.recipientEmail,
      event_type: params.eventType,
      subject: params.subject ?? null,
      resend_message_id: params.resendMessageId ?? null,
      error: params.error ?? null,
      metadata: params.metadata ?? null,
    });
    if (error) {
      console.error("[logEmailSend] insert failed:", error.message, params.eventType);
    }
  } catch (e) {
    console.error("[logEmailSend] unexpected error:", e);
  }
}
