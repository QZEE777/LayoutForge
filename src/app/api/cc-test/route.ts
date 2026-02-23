import { NextResponse } from "next/server";

/**
 * GET /api/cc-test
 * Diagnostic endpoint — tests the CloudConvert API key and returns status.
 * Remove this endpoint before going to production with paid users.
 */
export async function GET() {
  const apiKey = process.env.CLOUDCONVERT_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      step: "env",
      message: "CLOUDCONVERT_API_KEY is not set in environment variables.",
    });
  }

  // Test the key by calling the CloudConvert user endpoint
  try {
    const res = await fetch("https://api.cloudconvert.com/v2/users/me", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({
        ok: false,
        step: "auth",
        httpStatus: res.status,
        message: `CloudConvert rejected the key (HTTP ${res.status}). ${body.substring(0, 300)}`,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      ok: true,
      step: "done",
      username: data.data?.username,
      credits: data.data?.credits,
      message: "API key is valid. CloudConvert is connected.",
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      step: "network",
      message: `Network error reaching CloudConvert: ${e instanceof Error ? e.message : String(e)}`,
    });
  }
}
