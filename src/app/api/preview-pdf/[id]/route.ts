import { NextRequest, NextResponse } from "next/server";
import { getStored, readStoredFile } from "@/lib/storage";

export async function POST(
  request: NextRequest,
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

    const buffer = await readStoredFile(id);
    if (!buffer) {
      return NextResponse.json({ error: "Read failed" }, { status: 404 });
    }

    const mimeType = meta.mimeType || "";

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Extract preview text from DOCX using mammoth
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.convertToHtml({ buffer });
      const html = result.value || "";
      const text = html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000);

      return NextResponse.json({
        success: true,
        id,
        previewText: text,
        mimeType,
      });
    } else if (mimeType === "application/pdf") {
      return NextResponse.json({
        success: true,
        id,
        previewText: "PDF file ready for KDP formatting.",
        mimeType,
      });
    }

    return NextResponse.json(
      { error: "Unsupported format" },
      { status: 400 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[PREVIEW] Error:", msg);
    return NextResponse.json(
      { error: "Preview failed", message: msg },
      { status: 500 }
    );
  }
}
