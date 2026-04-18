import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { markDownloadPaid, updateMeta } from "@/lib/storage";
import { sendPartnerThresholdEmail, sendPackPurchaseEmail, sendSharePurchasePendingEmail, sendDownloadLinkEmail } from "@/lib/resend";
import { CHECKER_CREDITS_PER_SCAN } from "@/lib/redeemScanCredit";

export async function POST(req: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 }
    );
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json(
      { error: "Invalid body" },
      { status: 400 }
    );
  }

  const signature = req.headers.get("x-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 401 }
    );
  }

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sig = signature.startsWith("sha256=") ? signature.slice(7) : signature;
  if (hmac !== sig) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  let payload: {
    meta?: { event_name?: string; custom_data?: Record<string, unknown> };
    data?: { id?: string; attributes?: { user_email?: string; user_name?: string; total?: number } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const eventName = payload.meta?.event_name;
  if (eventName !== "order_created") {
    return NextResponse.json({ received: true });
  }

  const customData = payload.meta?.custom_data as Record<string, unknown> | undefined;
  const downloadId  = typeof customData?.download_id  === "string" ? customData.download_id  : "";
  const priceType   = typeof customData?.price_type   === "string" ? customData.price_type   : "single_use";
  const tool        = typeof customData?.tool         === "string" ? customData.tool         : "";
  const refCode     = typeof customData?.ref_code     === "string" ? customData.ref_code     : "";
  const shareToken  = typeof customData?.share_token  === "string" ? customData.share_token  : "";
  const email       = payload.data?.attributes?.user_email ?? "";
  const buyerEmail  = email ? email.toLowerCase() : "";
  const buyerName   = typeof payload.data?.attributes?.user_name === "string"
    ? payload.data.attributes.user_name.trim()
    : "";
  const orderId     = payload.data?.id != null ? String(payload.data.id) : "";
  const amount      = payload.data?.attributes?.total ?? 0;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Hoisted so the downloadId block below can also check it
  let alreadyProcessed = false;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Idempotency: skip insert if we already have this order (webhook retry)
    if (orderId) {
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("gateway_order_id", orderId)
        .limit(1)
        .maybeSingle();
      alreadyProcessed = !!existing;
    }

    if (!alreadyProcessed) {
      await supabase.from("payments").insert({
        email,
        payment_type: priceType,
        amount,
        status: "complete",
        tool,
        gateway: "lemonsqueezy",
        gateway_order_id: orderId,
        download_id: downloadId || null,
      });
      // Add scan credits for pack purchases + checker single-use bundle
      const PACK_CREDITS: Record<string, number> = {
        single_use: 2,
        author_pack: 6,
        indie_pack: 14,
        pro_pack: 30,
      };
      const PACK_NAMES: Record<string, string> = {
        single_use: "Checker Bundle (2 scans)",
        author_pack: "Author Pack (6 credits)",
        indie_pack:  "Indie Pack (14 credits)",
        pro_pack:    "Pro Pack (30 credits)",
      };
      if (priceType in PACK_CREDITS && email) {
        try {
          await supabase.from("scan_credits").insert({
            email: email.toLowerCase(),
            credits: PACK_CREDITS[priceType],
            source: priceType,
            order_id: `${orderId}:grant`,
          });
          // For checker single-use, consume one scan block immediately for this unlocked report.
          // User still keeps remaining credits for one free re-check.
          if (priceType === "single_use" && downloadId) {
            await supabase.from("scan_credits").insert({
              email: email.toLowerCase(),
              credits: -CHECKER_CREDITS_PER_SCAN,
              source: "scan_used",
              order_id: `${orderId}:initial_scan`,
            });
          }
        } catch (err) {
          console.error("[webhooks/lemonsqueezy] scan_credits insert failed:", err);
        }
        // Send pack confirmation email for explicit packs only.
        if (priceType !== "single_use") {
          try {
            await sendPackPurchaseEmail(email, {
              credits: PACK_CREDITS[priceType],
              packName: PACK_NAMES[priceType] ?? priceType,
              name: buyerName,
            });
          } catch (err) {
            console.error("[webhooks/lemonsqueezy] sendPackPurchaseEmail failed:", err);
          }
        }
      }

      if (priceType === "subscription") {
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        await supabase.from("subscriptions").insert({
          email,
          status: "active",
          plan: "6_months",
          current_period_end: sixMonthsFromNow.toISOString(),
        });
      }

      // Record affiliate referral conversion
      // Singles: 30% commission, Packs: 40% commission
      if (refCode) {
        try {
          const { data: affiliate } = await supabase
            .from("affiliates")
            .select("id, commission_rate")
            .eq("code", refCode)
            .eq("status", "active")
            .maybeSingle();

          if (affiliate) {
            const commissionRate = priceType === "single_use" ? 0.30 : 0.40;
            const commissionAmount = Math.round(amount * commissionRate);
            await supabase.from("referrals").insert({
              affiliate_code: refCode,
              converted: true,
              converted_at: new Date().toISOString(),
              order_id: orderId,
              sale_amount: amount,
              commission_amount: commissionAmount,
              paid_out: false,
            });
          }
        } catch (err) {
          console.error("[webhooks/lemonsqueezy] referral insert failed:", err);
        }
      }

      // ── Share-to-earn: award scan credit to result sharer ─────────────────
      // Only fires when NO partner ref_code is present (partner always takes priority)
      if (!refCode && shareToken && /^sh_[a-z0-9]{16}$/.test(shareToken) && orderId && email) {
        try {
          // Idempotency: check if this order_id already has a share reward
          const { data: existingReward } = await supabase
            .from("share_rewards")
            .select("reward_id")
            .eq("order_id", orderId)
            .maybeSingle();

          if (!existingReward) {
            // Verify token is active and get sharer info
            const { data: tokenRecord } = await supabase
              .from("share_tokens")
              .select("id, email, canonical_ref_id, token_status")
              .eq("token", shareToken)
              .eq("token_status", "active")
              .maybeSingle();

            if (tokenRecord) {
              // Fraud check 1: self-referral (sharer email === purchaser email)
              const sharerEmail = tokenRecord.email.toLowerCase();
              const buyerEmail  = email.toLowerCase();
              const isSelfReferral = sharerEmail === buyerEmail;

              if (!isSelfReferral) {
                // Compute purchaser hash first (needed for fraud check + reward record)
                const cryptoLib = await import("crypto");
                const SALT = process.env.HASH_SALT;
                if (!SALT) {
                  console.error("[webhooks/lemonsqueezy] HASH_SALT env var not set — share reward skipped");
                  throw new Error("HASH_SALT not configured");
                }
                const purchaserHash = "v1_" + cryptoLib.createHmac("sha256", SALT)
                  .update(buyerEmail).digest("hex");

                // Fraud check 2: check if this purchaser already converted via any share token
                const { data: priorConversion } = await supabase
                  .from("share_rewards")
                  .select("reward_id")
                  .eq("purchaser_email_hash", purchaserHash)
                  .limit(1)
                  .maybeSingle();

                // Refund window: 30 days from now
                const refundWindowCloses = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                await supabase.from("share_rewards").insert({
                  token:                  shareToken,
                  canonical_ref_id:       tokenRecord.canonical_ref_id,
                  order_id:               orderId,
                  sharer_email:           sharerEmail,
                  purchaser_email_hash:   purchaserHash,
                  reward_type:            "scan_credit",
                  credits_amount:         1,
                  status:                 "pending",
                  refund_window_closes_at: refundWindowCloses.toISOString(),
                  fraud_hold_reason:      priorConversion ? "repeat_buyer" : null,
                  fraud_hold_until:       priorConversion
                    ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
                    : null,
                });

                // Update last_click_at; counter is incremented atomically via RPC below
                await supabase
                  .from("share_tokens")
                  .update({
                    last_click_at: new Date().toISOString(),
                  })
                  .eq("token", shareToken);

                // Atomic increment via RPC (best effort)
                try {
                  await supabase.rpc("increment_share_conversions_pending", { p_token: shareToken });
                } catch { /* best effort */ }

                // Re-fetch updated token to get accurate counters after increment.
                let totalReferrals: number | undefined;
                try {
                  const PARTNER_THRESHOLD = 3;
                  const { data: updatedToken } = await supabase
                    .from("share_tokens")
                    .select("total_conversions, total_conversions_pending")
                    .eq("token", shareToken)
                    .maybeSingle();

                  if (updatedToken) {
                    totalReferrals = (updatedToken.total_conversions ?? 0) + (updatedToken.total_conversions_pending ?? 0);
                    if (totalReferrals === PARTNER_THRESHOLD) {
                      await sendPartnerThresholdEmail(sharerEmail);
                    }
                  }
                } catch { /* best effort — email is nice-to-have, not critical */ }

                // Immediate heads-up email: conversion recorded, credit pending release.
                try {
                  await sendSharePurchasePendingEmail(sharerEmail, {
                    credits: 1,
                    refundWindowClosesAt: refundWindowCloses.toISOString(),
                    underReview: !!priorConversion,
                    totalReferrals,
                  });
                } catch (emailErr) {
                  console.error("[webhooks/lemonsqueezy] sendSharePurchasePendingEmail failed:", emailErr);
                }
              }
            }
          }
        } catch (err) {
          console.error("[webhooks/lemonsqueezy] share_reward insert failed:", err);
        }
      }
    }
  }

  if (downloadId) {
    try {
      await markDownloadPaid(downloadId);
      if (buyerEmail) {
        updateMeta(downloadId, { leadEmail: buyerEmail }).catch(() => {});
      }
    } catch (err) {
      console.error("[webhooks/lemonsqueezy] markDownloadPaid failed:", err);
    }

    // Send one delivery email — report link + annotated PDF, no expiry pressure
    if (!alreadyProcessed && buyerEmail) {
      try {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com").replace(/\/$/, "");
        const reportUrl = `${appUrl}/download/${downloadId}?source=checker`;
        await sendDownloadLinkEmail(buyerEmail, reportUrl, buyerName || undefined);
      } catch (err) {
        console.error("[webhooks/lemonsqueezy] sendDownloadLinkEmail failed:", err);
      }
    }

    // Suppress nudge email — user has already paid
    if (email && supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from("scan_nudges")
          .update({ sent_at: new Date().toISOString() })
          .eq("email", email.toLowerCase())
          .eq("download_id", downloadId)
          .is("sent_at", null);
      } catch { /* best effort — nudge suppression is non-critical */ }
    }

    // Store buyer name on the scan metadata (best effort)
    if (buyerName) {
      updateMeta(downloadId, { buyerName }).catch(() => { /* best effort */ });
    }

    // Update TTL anchor on first delivery
    if (!alreadyProcessed && orderId && supabaseUrl && supabaseKey) {
      try {
        const sb = createClient(supabaseUrl, supabaseKey);
        await sb
          .from("payments")
          .update({ download_ttl_anchor_at: new Date().toISOString() })
          .eq("gateway_order_id", orderId);
      } catch (err) {
        console.error("[webhooks/lemonsqueezy] TTL anchor update failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
