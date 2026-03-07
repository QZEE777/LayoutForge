/**
 * GET /api/view-pdf/[id] — serve the stored PDF for inline viewing (e.g. checker report viewer).
 * Uses the same stored file as the upload; no auth (page is behind PaymentGate).
 */
import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    const meta = await getStored(id);
    if (!meta) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!meta.mimeType?.includes("pdf")) {
      return NextResponse.json({ error: "Not a PDF" }, { status: 400 });
    }
    const buffer = await readStoredFile(id);
    if (!buffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    const filename = (meta.originalName || "document.pdf").replace(/[^\w\s.-]/gi, "_");
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (e) {
    console.error("[view-pdf]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
