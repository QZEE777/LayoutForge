import { NextRequest, NextResponse } from "next/server";
import { getFileByKey } from "@/lib/r2Storage";

export const maxDuration = 60;

function isAllowedR2Key(key: string) {
  // Checker uploads use: uploads/<uuid>.pdf (from /api/create-upload-url)
  return /^uploads\/[0-9a-fA-F-]+\.pdf$/.test(key);
}

/**
 * GET /api/r2-file?key=uploads/<uuid>.pdf
 * Serves the raw uploaded PDF from R2 for same-origin preview.
 */
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key") ?? "";
    if (!key || !isAllowedR2Key(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const buf = await getFileByKey(key);
    const filename = key.split("/").pop() ?? "document.pdf";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": buf.length.toString(),
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (e) {
    console.error("[r2-file]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

