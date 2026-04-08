import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabaseServer";

const VALID_COINS = ["xrp", "xlm"] as const;
type PayoutCoin = (typeof VALID_COINS)[number];

export async function PATCH(req: Request) {
  // Auth — must be a logged-in partner
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payout_coin: PayoutCoin, payout_wallet: string, payout_memo: string;
  try {
    const body = await req.json();
    const coin = body?.payout_coin;
    if (typeof coin !== "string" || !(VALID_COINS as readonly string[]).includes(coin)) {
      return NextResponse.json({ error: "Invalid coin. Must be xrp or xlm." }, { status: 400 });
    }
    payout_coin   = coin as PayoutCoin;
    payout_wallet = typeof body?.payout_wallet === "string" ? body.payout_wallet.trim().slice(0, 200) : "";
    payout_memo   = typeof body?.payout_memo   === "string" ? body.payout_memo.trim().slice(0, 50)    : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!payout_wallet) {
    return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = user.email.trim().toLowerCase();

  const { error } = await service
    .from("affiliates")
    .update({
      payout_coin,
      payout_wallet,
      payout_memo: payout_memo || null,
    })
    .eq("email", email);

  if (error) {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
