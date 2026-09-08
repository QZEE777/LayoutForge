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
  const response = NextResponse.redirect(new URL(`/download/${id}?source=checker`, req.url), 303);
  Object.entries(CHECKER_PRIVATE_HEADERS).forEach(([key,value]) => response.headers.set(key,value));
  response.headers.append("Set-Cookie", checkerCookie(id));
  return response;
}
