import { NextResponse } from "next/server";
import { redeemScanCreditForDownload } from "@/lib/redeemScanCredit";
import crypto from "crypto";

// Must match credits/send-code exactly — same prefix, same fallback
function signToken(email: string, code: string, expiresAt: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback";
  return crypto.createHmac("sha256", secret).update(`cred|${email}|${code}|${expiresAt}`).digest("hex");
}

export async function POST(req: Request) {
  let email: string;
  let code: string;
  let token: string;
  let expiresAt: number;
  let downloadId: string;
  try {
    const body = await req.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    code = typeof body?.code === "string" ? body.code.trim() : "";
    token = typeof body?.token === "string" ? body.token : "";
    expiresAt = typeof body?.expiresAt === "number" ? body.expiresAt : 0;
    downloadId = typeof body?.downloadId === "string" ? body.downloadId : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !code || !token || !expiresAt || !downloadId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (Date.now() > expiresAt) {
    return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
  }

  const expected = signToken(email, code, expiresAt);
  if (expected !== token) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  const result = await redeemScanCreditForDownload(email, downloadId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, balance: result.balance });
}
