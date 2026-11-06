import { NextRequest, NextResponse } from "next/server";
import { checkerCookie, CHECKER_PRIVATE_HEADERS, verifyCheckerCapability } from "@/lib/checkerCapability";
import { checkerDenied } from "@/lib/checkerAccess";
import { getStored } from "@/lib/storage";

/** Exchange the private email capability for an HttpOnly cookie; redirect to a token-free URL. */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!verifyCheckerCapability(req.nextUrl.searchParams.get("token") ?? undefined, id, "email")) return checkerDenied();
  const meta = await getStored(id);
  if (!meta?.payment_confirmed || meta.processingReport?.outputType !== "checker") return checkerDenied();
  // Email "Download Annotated PDF" button: go straight to the file once it exists,
  // otherwise fall back to the report page.
  const wantsAnnotated = req.nextUrl.searchParams.get("next") === "annotated" && !!meta.annotatedPdfDownloadUrl;
  const target = wantsAnnotated ? `/api/checker-annotated-download?id=${id}` : `/download/${id}?source=checker`;
  const response = NextResponse.redirect(new URL(target, req.url), 303);
  Object.entries(CHECKER_PRIVATE_HEADERS).forEach(([key,value]) => response.headers.set(key,value));
  response.headers.append("Set-Cookie", checkerCookie(id));
  return response;
}
