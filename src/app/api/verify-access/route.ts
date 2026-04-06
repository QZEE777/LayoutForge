import { NextResponse } from "next/server";
import { getStored } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const downloadId = typeof body?.downloadId === "string" ? body.downloadId.trim() : "";
    const tool = typeof body?.tool === "string" ? body.tool.trim() : "";

    if (tool === "pdf-compress" || tool === "kdp-formatter-pdf") {
      return NextResponse.json({ access: true, type: "free" });
    }

    // Check payment_confirmed flag on this specific download (UUID-keyed, not spoofable)
    if (downloadId) {
      const meta = await getStored(downloadId);
      if (meta?.payment_confirmed) {
        return NextResponse.json({ access: true, type: "paid" });
      }
    }

    // Email-based subscription/beta checks are intentionally absent from this
    // unauthenticated endpoint to prevent email spoofing. Subscription access
    // should be validated via a session-authenticated route.
    return NextResponse.json({ access: false });
  } catch (e) {
    console.error("[verify-access]", e);
    return NextResponse.json({ access: false }, { status: 500 });
  }
}
