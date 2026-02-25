import { NextRequest, NextResponse } from "next/server";
import { listLeads } from "@/lib/storage";

/**
 * GET /api/admin/leads
 * Returns captured leads (PDF Compressor + any manuscript with leadEmail).
 * Auth: set ADMIN_SECRET in env; send header Authorization: Bearer <ADMIN_SECRET> or ?secret=<ADMIN_SECRET>.
 * If ADMIN_SECRET is not set, returns 503.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Not configured", message: "ADMIN_SECRET is not set. Set it to enable the back office." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");
  if (token !== secret) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing admin secret." },
      { status: 401 }
    );
  }

  try {
    const leads = await listLeads();
    return NextResponse.json({ leads });
  } catch (e) {
    console.error("[admin/leads]", e);
    return NextResponse.json(
      { error: "Internal error", message: e instanceof Error ? e.message : "Failed to list leads." },
      { status: 500 }
    );
  }
}
