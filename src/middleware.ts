import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (ref && /^[\w-]{8,}$/.test(ref)) {
    const response = NextResponse.next();
    response.cookies.set("m2p_ref", ref, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
    });
    return response;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
