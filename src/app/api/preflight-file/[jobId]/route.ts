import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const DEFAULT_PREFLIGHT_BASE_URL = "https://kdp-preflight-engine-production.up.railway.app";

function getBaseUrl() {
  return (process.env.KDP_PREFLIGHT_API_URL?.trim() || DEFAULT_PREFLIGHT_BASE_URL).replace(/\/$/, "");
}

function isUuid(value: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

/**
 * GET /api/preflight-file/[jobId]?type=original|annotated
 * Proxies preflight engine PDF bytes through same-origin, so the client viewer
 * never depends on preflight CORS/headers.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    if (!jobId || !isUuid(jobId)) {
      return NextResponse.json({ error: "Invalid jobId" }, { status: 400 });
    }

    const type = request.nextUrl.searchParams.get("type") === "annotated" ? "annotated" : "original";
    const baseUrl = getBaseUrl();
    const upstreamUrl =
      type === "annotated"
        ? `${baseUrl}/file/${encodeURIComponent(jobId)}/annotated`
        : `${baseUrl}/file/${encodeURIComponent(jobId)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    let res: Response;
    try {
      res = await fetch(upstreamUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Upstream failed", status: res.status, message: text.slice(0, 300) },
        { status: 502 }
      );
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const filename = `${jobId}${type === "annotated" ? ".annotated" : ""}.pdf`;

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
    console.error("[preflight-file]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

