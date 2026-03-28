import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { markDownloadPaid } from "@/lib/storage";
import { sendDownloadLinkEmail } from "@/lib/resend";

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
    data?: { id?: string; attributes?: { user_email?: string; total?: number } };
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
  const orderId     = payload.data?.id != null ? String(payload.data.id) : "";
  const amount      = payload.data?.attributes?.total ?? 0;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Idempotency: skip insert if we already have this order (webhook retry)
    let alreadyProcessed = false;
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
      });
      // Add scan credits for pack purchases
      const PACK_CREDITS: Record<string, number> = {
        author_pack: 3,
        indie_pack: 10,
        pro_pack: 25,
      };
      if (priceType in PACK_CREDITS && email) {
        try {
          await supabase.from("scan_credits").insert({
            email: email.toLowerCase(),
            credits: PACK_CREDITS[priceType],
            source: priceType,
            order_id: orderId,
          });
        } catch (err) {
          console.error("[webhooks/lemonsqueezy] scan_credits insert failed:", err);
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
                // Fraud check 2: check if this purchaser email already converted via any share token
                const { data: priorConversion } = await supabase
                  .from("share_rewards")
                  .select("reward_id")
                  .eq("sharer_email", sharerEmail)
                  .limit(1)
                  .maybeSingle();

                // Only award if first purchase from this buyer
                const crypto = await import("crypto");
                const SALT = process.env.HASH_SALT ?? "m2p_default_salt_change_in_prod";
                const purchaserHash = "v1_" + crypto.createHmac("sha256", SALT)
                  .update(buyerEmail).digest("hex");

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

                // Increment pending conversion counter on token
                await supabase
                  .from("share_tokens")
                  .update({
                    total_conversions_pending: supabase.rpc as unknown as number,
                    last_click_at: new Date().toISOString(),
                  })
                  .eq("token", shareToken);

                // Atomic increment via raw SQL (best effort)
                try {
                  await supabase.rpc("increment_share_conversions_pending", { p_token: shareToken });
                } catch { /* best effort */ }
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
    } catch (err) {
      console.error("[webhooks/lemonsqueezy] markDownloadPaid failed:", err);
    }
    if (email) {
      try {
        const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/download/${downloadId}`;
        await sendDownloadLinkEmail(email, downloadUrl);
      } catch (err) {
        console.error("[webhooks/lemonsqueezy] sendDownloadLinkEmail failed:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
