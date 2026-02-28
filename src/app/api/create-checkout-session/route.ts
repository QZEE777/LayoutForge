import { NextResponse } from "next/server";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const priceType = body?.priceType as string | undefined;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const tool = typeof body?.tool === "string" ? body.tool : "";
    const downloadId = typeof body?.downloadId === "string" ? body.downloadId : "";

    const apiKey = process.env.LEMONSQUEEZY_API_KEY;
    const storeId = process.env.LEMONSQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 503 }
      );
    }

    if (priceType !== "single_use" && priceType !== "subscription") {
      return NextResponse.json(
        { error: "Invalid priceType" },
        { status: 400 }
      );
    }

    lemonSqueezySetup({ apiKey });

    const variantId =
      priceType === "single_use"
        ? process.env.LEMONSQUEEZY_SINGLE_USE_VARIANT_ID
        : process.env.LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID;

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant not configured for this price type" },
        { status: 503 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (req.headers.get("origin") ?? "");
    const redirectUrl = downloadId
      ? `${baseUrl}/success?id=${encodeURIComponent(downloadId)}`
      : `${baseUrl}/success`;

    const checkout = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: email || undefined,
        custom: {
          tool,
          download_id: downloadId,
          price_type: priceType,
        },
      },
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
      },
      productOptions: {
        redirectUrl,
        receiptButtonText: "Download Your Manuscript",
        receiptThankYouNote:
          "Thank you! Click the button above to download your formatted manuscript.",
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

    return NextResponse.json({ checkoutUrl });
  } catch (e) {
    console.error("[create-checkout-session]", e);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
