import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.KDP_PREFLIGHT_API_URL?.trim();
  if (!baseUrl) {
    return NextResponse.json({ error: "Engine not configured" }, { status: 500 });
  }
  const job_id = request.nextUrl.searchParams.get("job_id");
  if (!job_id) {
    return NextResponse.json({ error: "Missing job_id", message: "Provide ?job_id=..." }, { status: 400 });
  }
  const url = baseUrl.replace(/\/$/, "");
  try {
    const res = await fetch(`${url}/file/${encodeURIComponent(job_id)}/annotated`);
    if (res.status === 202) {
      return NextResponse.json({ status: "processing" }, { status: 202 });
    }
    if (res.status === 404) {
      return new NextResponse(null, { status: 404 });
    }
    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${job_id}_annotated.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Engine unreachable" }, { status: 503 });
  }
}
