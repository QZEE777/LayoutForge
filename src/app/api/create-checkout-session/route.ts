import { NextResponse } from "next/server";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const priceType = body?.priceType as string | undefined;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const tool = typeof body?.tool === "string" ? body.tool : "";
    const downloadId = typeof body?.downloadId === "string" ? body.downloadId : "";

    // Affiliate referral tracking — read from 30-day cookie (partner code, priority 1)
    const cookieHeader = req.headers.get("cookie") ?? "";
    const refMatch = cookieHeader.match(/(?:^|;\s*)m2p_ref=([a-zA-Z0-9_-]{3,32})/);
    const refCode = refMatch ? refMatch[1].toLowerCase() : "";

    // Share-to-earn attribution — read from 30-day cookie (priority 2, only if no partner code)
    const shMatch = cookieHeader.match(/(?:^|;\s*)m2p_sh=(sh_[a-z0-9]{16})/);
    const shareToken = (!refCode && shMatch) ? shMatch[1] : "";

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 503 }
      );
    }

    const VALID_TYPES = ["single_use", "author_pack", "indie_pack", "pro_pack"];
    if (!VALID_TYPES.includes(priceType ?? "")) {
      return NextResponse.json(
        { error: "Invalid priceType" },
        { status: 400 }
      );
    }

    lemonSqueezySetup({ apiKey });

    const VARIANT_MAP: Record<string, string | undefined> = {
      single_use: process.env.LEMONSQUEEZY_SINGLE_USE_VARIANT_ID ?? "1346943",
      author_pack: process.env.LEMONSQUEEZY_AUTHOR_PACK_VARIANT_ID,
      indie_pack: process.env.LEMONSQUEEZY_INDIE_PACK_VARIANT_ID,
      pro_pack: process.env.LEMONSQUEEZY_PRO_PACK_VARIANT_ID,
    };

    const variantId = VARIANT_MAP[priceType ?? "single_use"];

    if (!variantId) {
      return NextResponse.json(
        { error: "This pack is not yet available. Check back soon." },
        { status: 503 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get("origin") ?? "");
    const isPack = priceType !== "single_use";
    const packEmailParam = (isPack && email) ? `&email=${encodeURIComponent(email)}` : "";
    const redirectUrl = isPack
      ? `${baseUrl}/success?pack=${encodeURIComponent(priceType ?? "")}${packEmailParam}`
      : downloadId
        ? `${baseUrl}/success?id=${encodeURIComponent(downloadId)}`
        : `${baseUrl}/success`;

    const checkout = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: email || undefined,
        custom: {
          tool,
          download_id:  downloadId,
          price_type:   priceType,
          ref_code:     refCode     || undefined,
          share_token:  shareToken  || undefined,
        },
      },
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
      },
      productOptions: {
        redirectUrl,
        receiptButtonText: isPack ? "View My Credits" : "Download Your Manuscript",
        receiptThankYouNote: isPack
          ? "Thank you! Your scan credits have been added to your account."
          : "Thank you! Click the button above to download your formatted manuscript.",
      },
    });

    if (checkout.error) {
      console.error("[create-checkout-session] Lemon Squeezy error:", checkout.error);
      return NextResponse.json(
        { error: "Checkout creation failed" },
        { status: 500 }
      );
    }

    const checkoutUrl =
      checkout.data?.data?.attributes?.url ??
      (checkout.data as { data?: { attributes?: { url?: string } } })?.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "No checkout URL returned" },
        { status: 500 }
      );
    }

    // Append ?aff=LS_CODE for LS native affiliate attribution when a partner ref is present
    let finalCheckoutUrl = checkoutUrl;
    if (refCode) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: aff } = await supabase
            .from("affiliates")
            .select("ls_affiliate_code")
            .eq("code", refCode)
            .eq("status", "active")
            .maybeSingle();
          if (aff?.ls_affiliate_code) {
            const sep = finalCheckoutUrl.includes("?") ? "&" : "?";
            finalCheckoutUrl = `${finalCheckoutUrl}${sep}aff=${aff.ls_affiliate_code}`;
          }
        }
      } catch { /* best effort — checkout still works without affiliate param */ }
    }

    return NextResponse.json({ checkoutUrl: finalCheckoutUrl });
  } catch (e) {
    console.error("[create-checkout-session]", e);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
