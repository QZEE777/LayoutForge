import { NextRequest, NextResponse } from "next/server";
import { listLeads } from "@/lib/storage";
import { checkAdminRateLimit } from "@/lib/rateLimitAdmin";
import { requireAdminPermission } from "@/lib/adminAccess";

/**
 * GET /api/admin/leads
 * Returns captured leads from storage (manuscript meta with leadEmail).
 * Auth: x-admin-password = ADMIN_PASSWORD_MANU2 (scoped via requireAdminPermission).
 */
export async function GET(request: NextRequest) {
  const rateLimitRes = checkAdminRateLimit(request);
  if (rateLimitRes) return rateLimitRes;

  const auth = requireAdminPermission(request, "admin.leads.read");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

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
