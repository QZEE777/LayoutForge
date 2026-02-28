import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { markDownloadPaid } from "@/lib/storage";

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
  const downloadId = typeof customData?.download_id === "string" ? customData.download_id : "";
  const priceType = typeof customData?.price_type === "string" ? customData.price_type : "single_use";
  const tool = typeof customData?.tool === "string" ? customData.tool : "";
  const email = payload.data?.attributes?.user_email ?? "";
  const orderId = payload.data?.id != null ? String(payload.data.id) : "";
  const amount = payload.data?.attributes?.total ?? 0;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("payments").insert({
      email,
      payment_type: priceType,
      amount,
      status: "complete",
      tool,
      gateway: "lemonsqueezy",
      gateway_order_id: orderId,
    });

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

  if (downloadId) {
    try {
      await markDownloadPaid(downloadId);
    } catch (err) {
      console.error("[webhooks/lemonsqueezy] markDownloadPaid failed:", err);
    }
  }

  return NextResponse.json({ received: true });
}
