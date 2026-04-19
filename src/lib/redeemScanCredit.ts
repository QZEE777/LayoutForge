import { createClient } from "@supabase/supabase-js";
import { markDownloadPaid, getStored, updateMeta } from "@/lib/storage";
import { loadScanCreditBalanceForEmail } from "@/lib/scanCredits";
import { sendDownloadLinkEmail } from "@/lib/resend";
import { annotateCheckerPdf } from "@/lib/annotatePdf";
import { generateAndStoreReportPdf } from "@/lib/generateReportPdf";

export type RedeemScanCreditResult =
  | { ok: true; balance: number; alreadyUnlocked?: boolean }
  | { ok: false; error: string; status: number };

export const CHECKER_CREDITS_PER_SCAN = 1;

/**
 * Deduct checker scan credits and unlock a checker download. Shared by OTP and session routes.
 */
export async function redeemScanCreditForDownload(
  emailRaw: string,
  downloadId: string
): Promise<RedeemScanCreditResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Invalid request", status: 400 };
  }
  if (!downloadId) {
    return { ok: false, error: "Invalid request", status: 400 };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const existingMeta = await getStored(downloadId).catch(() => null);
  if (existingMeta?.payment_confirmed) {
    const bal = await loadScanCreditBalanceForEmail(supabase, email);
    return { ok: true, balance: bal.remaining, alreadyUnlocked: true };
  }

  const { remaining: balanceBefore } = await loadScanCreditBalanceForEmail(supabase, email);
  if (balanceBefore < CHECKER_CREDITS_PER_SCAN) {
    return {
      ok: false,
      error: `Not enough scan credits. ${CHECKER_CREDITS_PER_SCAN} credits are required per scan.`,
      status: 402,
    };
  }

  const { error: insertErr } = await supabase.from("scan_credits").insert({
    email,
    credits: -CHECKER_CREDITS_PER_SCAN,
    source: "scan_used",
    order_id: downloadId,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      const meta2 = await getStored(downloadId).catch(() => null);
      if (meta2?.payment_confirmed) {
        const bal = await loadScanCreditBalanceForEmail(supabase, email);
        return { ok: true, balance: bal.remaining, alreadyUnlocked: true };
      }
    }
    console.error("[redeemScanCredit] insert failed:", insertErr);
    return {
      ok: false,
      error: "Failed to redeem credit. Try again or contact support.",
      status: 500,
    };
  }

  await supabase.from("payments").insert({
    email,
    payment_type: "credit_used",
    amount: 0,
    status: "complete",
    tool: "kdp_pdf_checker",
    gateway: "credits",
    gateway_order_id: downloadId,
  });

  try {
    await markDownloadPaid(downloadId);
    await updateMeta(downloadId, { leadEmail: email }).catch(() => {});
  } catch (err) {
    console.error("[redeemScanCredit] markDownloadPaid failed:", err);
    return {
      ok: false,
      error: "Failed to unlock download. Contact support.",
      status: 500,
    };
  }

  // Send delivery email with annotated PDF + full report links (best effort)
  console.log("[TRACE:1] payment-confirmed entry — starting email flow");
  try {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com").replace(/\/$/, "");
    const reportUrl = `${appUrl}/download/${downloadId}?source=checker`;

    let annotatedPdfUrl: string | undefined;
    let fullReportPdfUrl: string | undefined;
    try {
      console.log("[TRACE:2] annotated PDF — start");
      console.log("[TRACE:3] full report PDF — start");
      const [annotated, reportPdf] = await Promise.allSettled([
        annotateCheckerPdf(downloadId),
        Promise.race([
          generateAndStoreReportPdf(downloadId),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
        ]),
      ]);
      if (annotated.status === "fulfilled") {
        annotatedPdfUrl = annotated.value?.annotatedPdfDownloadUrl ?? undefined;
        console.log("[TRACE:2] annotated PDF — end, url:", annotatedPdfUrl ? "OK" : "null");
      } else {
        console.error("[TRACE:2] annotated PDF — FAILED:", annotated.reason);
      }
      if (reportPdf.status === "fulfilled") {
        fullReportPdfUrl = reportPdf.value?.fullReportPdfDownloadUrl ?? undefined;
        console.log("[TRACE:3] full report PDF — end, url:", fullReportPdfUrl ? "OK" : "null/timeout");
      } else {
        console.error("[TRACE:3] full report PDF — FAILED:", reportPdf.reason);
      }
    } catch (err) {
      console.error("[TRACE:2/3] PDF generation block threw:", err);
    }

    console.log("[TRACE:4] email send — trigger, annotated:", !!annotatedPdfUrl, "report:", !!fullReportPdfUrl);
    await sendDownloadLinkEmail(email, reportUrl, annotatedPdfUrl, undefined, fullReportPdfUrl);
    console.log("[TRACE:5] email send — SUCCESS");
  } catch (err) {
    console.error("[TRACE:5] email send — FAILED:", err);
  }

  try {
    await supabase
      .from("scan_nudges")
      .update({ sent_at: new Date().toISOString() })
      .eq("email", email)
      .eq("download_id", downloadId)
      .is("sent_at", null);
  } catch {
    /* best effort */
  }

  return { ok: true, balance: Math.max(0, balanceBefore - CHECKER_CREDITS_PER_SCAN) };
}
