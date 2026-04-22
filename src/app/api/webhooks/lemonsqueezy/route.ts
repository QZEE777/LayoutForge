import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { markDownloadPaid, updateMeta } from "@/lib/storage";
import { sendPackPurchaseEmail, sendDownloadLinkEmail } from "@/lib/resend";
import { CHECKER_CREDITS_PER_SCAN } from "@/lib/redeemScanCredit";
import { annotateCheckerPdf } from "@/lib/annotatePdf";

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
        author_pack: 5,
        indie_pack: 10,
        pro_pack: 20,
      };
      const PACK_NAMES: Record<string, string> = {
        single_use: "Checker Bundle (2 scans)",
        author_pack: "Author Pack (5 credits)",
        indie_pack:  "Indie Pack (10 credits)",
        pro_pack:    "Pro Pack (20 credits)",
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

    // Send one delivery email with annotated PDF + full report links
    if (!alreadyProcessed && buyerEmail) {
      try {
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.manu2print.com").replace(/\/$/, "");
        const reportUrl = `${appUrl}/download/${downloadId}?source=checker`;

        // Annotate the PDF inline so both download links are ready in the email
        let annotatedPdfUrl: string | undefined;
        try {
          const annotated = await annotateCheckerPdf(downloadId);
          annotatedPdfUrl = annotated?.annotatedPdfDownloadUrl ?? undefined;
        } catch (annotateErr) {
          console.error("[webhooks/lemonsqueezy] annotateCheckerPdf failed (non-fatal):", annotateErr);
        }

        await sendDownloadLinkEmail(buyerEmail, reportUrl, annotatedPdfUrl, buyerName || undefined);
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
