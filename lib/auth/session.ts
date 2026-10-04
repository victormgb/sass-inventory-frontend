import "server-only";

import { cookies } from "next/headers";

import { SESSION_MAX_AGE, TENANT_COOKIE, TOKEN_COOKIE } from "./constants";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE,
} as const;

/**
 * Stores the Sanctum token and the active tenant slug in httpOnly cookies.
 *
 * httpOnly is the reason this is not localStorage: a bearer token in
 * localStorage is readable by any script that runs on the page, so a single XSS
 * bug hands an attacker a full API session. Here the browser never sees the
 * token, and only this server can talk to Laravel.
 */
export async function writeSession(token: string, tenantSlug: string): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, cookieOptions);
  store.set(TENANT_COOKIE, tenantSlug, cookieOptions);
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(TENANT_COOKIE);
}

export async function readSession(): Promise<{
  token: string;
  tenantSlug: string;
} | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  const tenantSlug = store.get(TENANT_COOKIE)?.value;

  if (!token || !tenantSlug) {
    return null;
  }

  return { token, tenantSlug };
}
