import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[webhooks/stripe] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessionId = session.id;
      const customerId = session.customer as string | null;
      const customerEmail = session.customer_email || session.customer_details?.email || null;

      await supabase
        .from("payments")
        .update({
          status: "complete",
          stripe_customer_id: customerId,
        })
        .eq("stripe_session_id", sessionId);

      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await supabase.from("subscriptions").insert({
          email: customerEmail,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          status: sub.status === "active" ? "active" : sub.status,
          plan: "6_months",
          current_period_end: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null,
        });
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status === "active" ? "active" : sub.status === "canceled" ? "cancelled" : "expired";
      await supabase
        .from("subscriptions")
        .update({
          status,
          current_period_end: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null,
        })
        .eq("stripe_subscription_id", sub.id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhooks/stripe]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
