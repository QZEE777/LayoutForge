import { NextResponse } from "next/server";
import { checkMagicLinkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const allowed = await checkMagicLinkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limit_exceeded" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    if (!body?.email || typeof body.email !== "string") {
      return NextResponse.json(
        { error: "email_required" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "invalid_body" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
