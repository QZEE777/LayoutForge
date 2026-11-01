import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setSecurityHeaders } from "@/lib/middlewareSecurity";

export function middleware(request: NextRequest) {
  // Pass the path to the root layout so every page gets a self-pointing canonical.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  const ref = request.nextUrl.searchParams.get("ref");
  const alreadySet = request.cookies.get("m2p_ref");
  if (ref && !alreadySet && /^[\w-]{3,}$/.test(ref)) {
    response.cookies.set("m2p_ref", ref, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return setSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
