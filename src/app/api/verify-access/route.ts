import { requireCheckerAccess } from "@/lib/checkerAccess";
import { NextResponse } from "next/server";
import { getStored } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const downloadId = typeof body?.downloadId === "string" ? body.downloadId.trim() : "";
    const tool = typeof body?.tool === "string" ? body.tool.trim() : "";

    // Resolve checker access before trusting a caller-supplied tool label.
    if (downloadId) {
      const meta = await getStored(downloadId);
      if (meta?.processingReport?.outputType === "checker") {
        const denied = await requireCheckerAccess(req, downloadId, { meta, paid: true });
        return NextResponse.json({ access: !denied, type: denied ? undefined : "paid" }, { headers: { "Cache-Control": "private, no-store" } });
      }
      if (meta?.payment_confirmed) {
        return NextResponse.json({ access: true, type: "paid" });
      }
    }

    if (tool === "pdf-compress" || tool === "kdp-formatter-pdf") {
      return NextResponse.json({ access: true, type: "free" });
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
