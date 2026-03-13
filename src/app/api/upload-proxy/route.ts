import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

/** Vercel serverless body limit ~4.5 MB. Reject larger before reading body. */
const PROXY_MAX_BYTES = 4.5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const renderUrl = process.env.KDP_PREFLIGHT_API_URL || process.env.NEXT_PUBLIC_KDP_PREFLIGHT_API_URL;

  if (!renderUrl) {
    return NextResponse.json({ error: "Render URL not configured" }, { status: 500 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!Number.isNaN(size) && size > PROXY_MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large for upload (max 4.5 MB). Use PDF Compressor or a smaller file." },
        { status: 413 }
      );
    }
  }

  try {
    const formData = await request.formData();

    const response = await fetch(`${renderUrl.replace(/\/$/, "")}/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

