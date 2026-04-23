import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setSecurityHeaders } from "@/lib/security";

export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  const alreadySet = request.cookies.get("m2p_ref");
  if (ref && !alreadySet && /^[\w-]{3,}$/.test(ref)) {
    const response = NextResponse.next();
    response.cookies.set("m2p_ref", ref, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    });
    return setSecurityHeaders(response);
  }
  return setSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
