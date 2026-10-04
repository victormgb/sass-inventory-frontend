import { NextResponse, type NextRequest } from "next/server";

import { TENANT_COOKIE, TOKEN_COOKIE } from "@/lib/auth/constants";

/**
 * Gate for the private area. This only checks that a session cookie exists; it
 * does not prove the token is still valid. That check belongs in the server
 * components and actions, which call Laravel and handle a 401 properly.
 *
 * In Next.js 16 this file convention is `proxy`, not `middleware`.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const tenant = request.cookies.get(TENANT_COOKIE)?.value;

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // The URL segment and the session must agree, otherwise the server would ask
  // Laravel for an organization the signed-in user does not belong to.
  const requestedTenant = request.nextUrl.pathname.split("/")[2];

  if (tenant && requestedTenant && requestedTenant !== tenant) {
    const url = new URL(`/app/${tenant}/dashboard`, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
