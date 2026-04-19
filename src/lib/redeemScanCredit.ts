import { createClient } from "@supabase/supabase-js";
import { markDownloadPaid, getStored, updateMeta } from "@/lib/storage";
import { loadScanCreditBalanceForEmail } from "@/lib/scanCredits";
import { sendDownloadLinkEmail } from "@/lib/resend";
import { annotateCheckerPdf } from "@/lib/annotatePdf";
import crypto from "crypto";

/** Stable short ref_id derived from downloadId — never equals the downloadId itself. */
function generateRefId(downloadId: string): string {
  return crypto.createHash("sha256").update(downloadId).digest("hex").slice(0, 12);
}

export type RedeemScanCreditResult =
  | { ok: true; balance: number; alreadyUnlocked?: boolean }
  | { ok: false; error: string; status: number };

export const CHECKER_CREDITS_PER_SCAN = 1;

/**
 * Deduct checker scan credits and unlock a checker download. Shared by OTP and session routes.
 */
export async function redeemScanCreditForDownload(
  emailRaw: string,
  downloadId: string,
  refCookie?: string,
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

  // Award referral credit to referring scan owner (best effort)
  if (refCookie && refCookie !== generateRefId(downloadId)) {
    try {
      const { data: refRow } = await supabase
        .from("referral_credits")
        .select("owner_ref, credits")
        .eq("ref_id", refCookie)
        .single();
      if (refRow && refRow.owner_ref && refRow.owner_ref !== email) {
        await supabase.from("scan_credits").insert({
          email: refRow.owner_ref,
          credits: 1,
          source: "referral",
          order_id: `ref_${refCookie}_${downloadId}`,
        });
        await supabase
          .from("referral_credits")
          .update({ credits: refRow.credits + 1, updated_at: new Date().toISOString() })
          .eq("ref_id", refCookie);
      }
    } catch {
      /* non-fatal */
    }
  }

  // Generate stable ref_id and store in referral_credits (best effort)
  const refId = generateRefId(downloadId);
  void supabase.from("referral_credits").upsert(
    { ref_id: refId, owner_ref: email, credits: 0 },
    { onConflict: "ref_id", ignoreDuplicates: true }
  );

  // Send delivery email with annotated PDF (best effort)
  try {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com").replace(/\/$/, "");
    const reportUrl = `${appUrl}/download/${downloadId}?source=checker`;

    let annotatedPdfUrl: string | undefined;
    try {
      const annotated = await annotateCheckerPdf(downloadId);
      annotatedPdfUrl = annotated?.annotatedPdfDownloadUrl ?? undefined;
    } catch (annotateErr) {
      console.error("[redeemScanCredit] annotateCheckerPdf failed (non-fatal):", annotateErr);
    }

    await sendDownloadLinkEmail(email, reportUrl, annotatedPdfUrl, undefined, refId);
  } catch (err) {
    console.error("[redeemScanCredit] sendDownloadLinkEmail failed:", err);
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
