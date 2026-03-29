import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { markDownloadPaid } from "@/lib/storage";
import { sendDownloadLinkEmail } from "@/lib/resend";
import crypto from "crypto";

function signToken(email: string, code: string, expiresAt: number): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "fallback";
  return crypto.createHmac("sha256", secret).update(`cred|${email}|${code}|${expiresAt}`).digest("hex");
}

export async function POST(req: Request) {
  let email: string, code: string, token: string, expiresAt: number, downloadId: string;
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

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Check credit balance — exclude expired rows
  const now = new Date().toISOString();
  const { data: creditRows } = await supabase
    .from("scan_credits")
    .select("credits")
    .eq("email", email)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  const balance = (creditRows ?? []).reduce((sum: number, r: { credits: number }) => sum + (r.credits ?? 0), 0);

  if (balance <= 0) {
    return NextResponse.json({ error: "No scan credits remaining. Purchase a pack to continue." }, { status: 402 });
  }

  // Deduct 1 credit (ledger entry)
  await supabase.from("scan_credits").insert({
    email,
    credits: -1,
    source: "scan_used",
    order_id: downloadId,
  });

  // Record as a payment (for admin visibility)
  await supabase.from("payments").insert({
    email,
    payment_type: "credit_used",
    amount: 0,
    status: "complete",
    tool: "kdp_pdf_checker",
    gateway: "credits",
    gateway_order_id: downloadId,
  });

  // Mark the download as paid and send download email
  try {
    await markDownloadPaid(downloadId);
  } catch (err) {
    console.error("[credits/use] markDownloadPaid failed:", err);
    return NextResponse.json({ error: "Failed to unlock download. Contact support." }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const downloadUrl = `${baseUrl}/download/${downloadId}`;

  if (email) {
    try {
      await sendDownloadLinkEmail(email, downloadUrl);
    } catch (err) {
      console.error("[credits/use] sendDownloadLinkEmail failed:", err);
      // Non-fatal — download is still unlocked
    }
  }

  return NextResponse.json({ ok: true, balance: balance - 1 });
}
