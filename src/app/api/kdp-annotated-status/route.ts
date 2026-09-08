import { NextRequest, NextResponse } from "next/server";
import { requireCheckerAccess } from "@/lib/checkerAccess";
import { getStored, normalizeAnnotatedPdfStatus } from "@/lib/storage";
import { CHECKER_PRIVATE_HEADERS } from "@/lib/checkerCapability";
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const denied = await requireCheckerAccess(req, id, { paid: true });
  if (denied) return denied;
  const meta = await getStored(id);
  return NextResponse.json({ status: normalizeAnnotatedPdfStatus(meta?.annotatedPdfStatus, meta?.annotatedEmailSentAt) }, { headers: CHECKER_PRIVATE_HEADERS });
}
