import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ hasAccess: false, accessType: "none" });
  }

  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : null;
    const email = typeof body?.email === "string" ? body.email.trim() : null;

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
      if (session.payment_status === "paid" && session.status === "complete") {
        return NextResponse.json({ hasAccess: true, accessType: "payment" });
      }
    }

    if (email) {
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("email", email)
        .eq("status", "active")
        .limit(1);
      if (subs && subs.length > 0) {
        return NextResponse.json({ hasAccess: true, accessType: "subscription" });
      }
    }

    return NextResponse.json({ hasAccess: false, accessType: "none" });
  } catch {
    return NextResponse.json({ hasAccess: false, accessType: "none" });
  }
}
