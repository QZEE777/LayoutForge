import { NextRequest, NextResponse } from "next/server";
import { getStored } from "@/lib/storage";
import { requireCheckerAccess } from "@/lib/checkerAccess";
import { CHECKER_PRIVATE_HEADERS } from "@/lib/checkerCapability";
import { getSignedDownloadUrl } from "@/lib/r2Storage";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const denied = await requireCheckerAccess(req, id, { paid: true });
  if (denied) return denied;
  const meta = await getStored(id);
  if (!meta?.annotatedPdfDownloadUrl) return NextResponse.json({ error: "Annotation is not ready" }, { status: 409, headers: CHECKER_PRIVATE_HEADERS });
  // Use the stored filename only, never a caller-supplied URL or arbitrary key.
  const name = new URL(meta.annotatedPdfDownloadUrl).pathname.split("/").pop();
  if (!name || !/^[\w.-]+\.pdf$/.test(name)) return NextResponse.json({ error: "Annotation unavailable" }, { status: 409, headers: CHECKER_PRIVATE_HEADERS });
  const response = NextResponse.redirect(await getSignedDownloadUrl(id, name, 300), 303);
  Object.entries(CHECKER_PRIVATE_HEADERS).forEach(([k,v]) => response.headers.set(k,v));
  return response;
}
