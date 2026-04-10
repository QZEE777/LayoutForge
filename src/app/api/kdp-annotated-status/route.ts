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
    const res = await fetch(`${url}/annotate/${encodeURIComponent(job_id)}/status`);
    if (!res.ok) {
      return NextResponse.json({ error: "Engine unreachable" }, { status: 503 });
    }
    const data = await res.json();
    // Read-only endpoint by design: do not mutate metadata or trigger emails here.
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Engine unreachable" }, { status: 503 });
  }
}
