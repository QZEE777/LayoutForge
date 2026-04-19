import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { redeemScanCreditForDownload } from "@/lib/redeemScanCredit";
import { cookies } from "next/headers";

/**
 * Redeem one scan credit using the logged-in Supabase user email (no OTP).
 * Same ledger + unlock behavior as POST /api/credits/use.
 */
export async function POST(req: Request) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  const email = user?.email?.trim().toLowerCase() ?? "";
  if (!email) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let downloadId = "";
  try {
    const body = await req.json();
    downloadId = typeof body?.downloadId === "string" ? body.downloadId.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!downloadId) {
    return NextResponse.json({ error: "Missing downloadId" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const refCookie = cookieStore.get("m2p_ref")?.value;
  const result = await redeemScanCreditForDownload(email, downloadId, refCookie);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    balance: result.balance,
    alreadyUnlocked: result.alreadyUnlocked ?? false,
  });
}
