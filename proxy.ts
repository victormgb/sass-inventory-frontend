import { NextResponse, type NextRequest } from "next/server";

import { TENANT_COOKIE, TOKEN_COOKIE } from "@/lib/auth/constants";
import {
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  isLocale,
  negotiateLocale,
} from "@/lib/i18n/config";

/**
 * Gate for the private area, plus first-visit language detection.
 *
 * The session half only checks that a session cookie exists; it does not prove the
 * token is still valid. That check belongs in the server components and actions,
 * which call Laravel and handle a 401 properly.
 *
 * In Next.js 16 this file convention is `proxy`, not `middleware`.
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPrivateArea = pathname.startsWith("/app");

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const tenant = request.cookies.get(TENANT_COOKIE)?.value;

  if (isPrivateArea && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // The URL segment and the session must agree, otherwise the server would ask
  // Laravel for an organization the signed-in user does not belong to.
  //
  // Index 2 is correct only because the private area starts at /app/. That is
  // exactly the coupling a locale prefix such as /en/app/ would have broken, and
  // the reason the language lives in a cookie instead of the URL.
  const requestedTenant = pathname.split("/")[2];

  if (isPrivateArea && tenant && requestedTenant && requestedTenant !== tenant) {
    const url = new URL(`/app/${tenant}/dashboard`, request.url);
    return NextResponse.redirect(url);
  }

  return withLocaleCookie(request);
}

/**
 * Remembers what the browser asked for, so the choice survives past the first
 * request.
 *
 * The cookie is only written when it is missing or unreadable. An existing value is
 * the user's explicit pick and outranks the header from here on: someone who chose
 * English on a shared machine should not have it flip back because a second window
 * declared a different preference.
 *
 * This does not make the first render correct on its own -- a cookie set on the
 * response is not visible to the request being rendered right now. That is what the
 * Accept-Language fallback in getLocale() is for; the cookie only removes the cost
 * of negotiating again on every later request.
 */
function withLocaleCookie(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const stored = request.cookies.get(LOCALE_COOKIE)?.value;

  if (isLocale(stored)) {
    return response;
  }

  const locale = negotiateLocale(request.headers.get("accept-language"));

  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: LOCALE_MAX_AGE,
  });

  return response;
}

export const config = {
  /**
   * Wider than the private area on purpose: the language has to be detected on the
   * login and register pages too, otherwise a first-time visitor picks English in
   * the dropdown and the session pages stay Spanish.
   *
   * `_next` is the build output and must not be rewritten, and `api` is excluded
   * because the logo upload Route Handler reads the session itself and answers with
   * its own JSON -- a redirect or a redirect-shaped cookie on that path would be
   * noise the client then has to parse around.
   */
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};