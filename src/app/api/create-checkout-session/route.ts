import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_SINGLE_USE || !process.env.STRIPE_PRICE_SIX_MONTHS) {
    return NextResponse.json(
      { error: "Payment gateway not configured yet." },
      { status: 503 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000";
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const body = await request.json();
    const tool = typeof body?.tool === "string" ? body.tool : "kdp-formatter";
    const paymentType = body?.paymentType === "subscription" ? "subscription" : "single_use";
    const email = typeof body?.email === "string" ? body.email.trim() : undefined;
    const fileId = typeof body?.fileId === "string" ? body.fileId : "";

    const priceId = paymentType === "subscription" ? process.env.STRIPE_PRICE_SIX_MONTHS : process.env.STRIPE_PRICE_SINGLE_USE;
    const amount = paymentType === "single_use" ? 700 : 2700; // cents

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: paymentType === "subscription" ? "subscription" : "payment",
      payment_method_types: ["card"],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&tool=${encodeURIComponent(tool)}${fileId ? `&file_id=${encodeURIComponent(fileId)}` : ""}`,
      cancel_url: `${baseUrl}${tool === "kdp-formatter-pdf" ? "/kdp-formatter-pdf" : tool === "epub-maker" ? "/epub-maker" : "/kdp-formatter"}`,
      metadata: { tool },
      line_items: [{ price: priceId!, quantity: 1 }],
    };
    if (email) sessionParams.customer_email = email;

    const session = await stripe.checkout.sessions.create(sessionParams);

    await supabase.from("payments").insert({
      email: session.customer_email || email || null,
      stripe_session_id: session.id,
      payment_type: paymentType,
      amount,
      status: "pending",
      tool,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout-session]", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
