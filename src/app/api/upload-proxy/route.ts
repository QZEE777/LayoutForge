import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const renderUrl = process.env.KDP_PREFLIGHT_API_URL || process.env.NEXT_PUBLIC_KDP_PREFLIGHT_API_URL;

  if (!renderUrl) {
    return NextResponse.json({ error: "Render URL not configured" }, { status: 500 });
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

