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

    const VALID_TYPES = ["single_use", "author_pack", "indie_pack", "pro_pack"];
    if (!VALID_TYPES.includes(priceType ?? "")) {
      return NextResponse.json(
        { error: "Invalid priceType" },
        { status: 400 }
      );
    }

    lemonSqueezySetup({ apiKey });

    const VARIANT_MAP: Record<string, string | undefined> = {
      single_use: process.env.LEMONSQUEEZY_SINGLE_USE_VARIANT_ID ?? "1473395",
      author_pack: process.env.LEMONSQUEEZY_AUTHOR_PACK_VARIANT_ID ?? "1473418",
      indie_pack: process.env.LEMONSQUEEZY_INDIE_PACK_VARIANT_ID  ?? "1473420",
      pro_pack: process.env.LEMONSQUEEZY_PRO_PACK_VARIANT_ID      ?? "1473421",
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
          download_id: downloadId,
          price_type:  priceType,
        },
      },
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
      },
      productOptions: {
        redirectUrl,
        receiptButtonText: isPack ? "View My Credits" : "View My Report",
        receiptThankYouNote: isPack
          ? "Thank you! Your scan credits have been added to your account."
          : "Thank you! Your checker purchase includes 2 scans (2 credits total, 1 per scan).",
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
