/**
 * Single source of truth for outbound email subjects and subject hints echoed in bodies.
 */

/**
 * Default subject for sendDownloadLinkEmail when buyer name is absent — keep resend-help
 * copy aligned so users search for text that matches the real confirmation email.
 * (When `name` is provided, the live subject is personalized; see downloadLinkReportSubject.)
 */
export const DOWNLOAD_LINK_DEFAULT_SUBJECT_HINT =
  "You're in — your full KDP report is ready";

export const RESEND_HELP_SUBJECT = "Your manu2print download link";

export function downloadLinkReportSubject(_firstName?: string | undefined): string {
  return "Your KDP report is ready — download your annotated PDF";
}

export function packPurchaseSubject(
  firstName: string | undefined,
  packName: string,
  credits: number,
  creditWord: string
): string {
  return firstName
    ? `${firstName} — ${packName} confirmed, ${credits} ${creditWord} loaded`
    : `${packName} confirmed — ${credits} ${creditWord} loaded and ready`;
}

export const WELCOME_EMAIL_SUBJECT =
  "Your KDP readiness report is waiting — here's what we found";

export const ANNOTATED_PDF_SUBJECT = "Your annotated PDF is ready";

export const SCAN_NUDGE_SUBJECT = "Your KDP report is still waiting — manu2print";

export function cronFailureEmailSubject(cronName: string, dateIsoYmd: string): string {
  return `⚠️ Cron failure: ${cronName} — ${dateIsoYmd}`;
}

export const EXPIRY_WARNING_SUBJECT = "⏰ Your KDP report expires in 2 hours — manu2print";

export const SCAN_CREDIT_OTP_SUBJECT =
  "Your scan credit verification code — manu2print";

export const MY_ORDERS_OTP_SUBJECT = "Your manu2print verification code";

export const AFFILIATE_OTP_SUBJECT = "Your affiliate dashboard code — manu2print";
