import { NextRequest, NextResponse } from "next/server";
import { listLeads } from "@/lib/storage";
import { checkAdminRateLimit } from "@/lib/rateLimitAdmin";

/**
 * GET /api/admin/leads
 * Returns captured leads from storage (manuscript meta with leadEmail).
 * Auth: x-admin-password = ADMIN_PASSWORD_MANU2, or ADMIN_SECRET (Bearer / ?secret=).
 */
export async function GET(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const password = (request.headers.get("x-admin-password") ?? "").trim();
  const expectedPassword = process.env.ADMIN_PASSWORD_MANU2?.trim();
  const secret = process.env.ADMIN_SECRET;
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");

  const allowedByPassword = expectedPassword && password === expectedPassword;
  const allowedBySecret = secret && token === secret;
  if (!allowedByPassword && !allowedBySecret) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing admin auth." },
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
