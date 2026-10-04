import "server-only";

import { redirect } from "next/navigation";

import { ApiError, apiMe } from "@/lib/api/laravel";
import type { MeResponse } from "@/lib/types";

import { tenantDashboardPath } from "./redirect-path";
import { clearSession, readSession } from "./session";

/**
 * Server-side session guard for the private area.
 *
 * Redirects to /login when there is no session, when the URL tenant does not
 * match the session tenant, or when Laravel rejects the stored token. A rejected
 * token also clears the cookies so the user is not bounced back and forth.
 */
export async function requireSession(expectedTenant?: string): Promise<MeResponse> {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  if (expectedTenant && expectedTenant !== session.tenantSlug) {
    redirect(tenantDashboardPath(session.tenantSlug));
  }

  try {
    return await apiMe<MeResponse>(session);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      await clearSession();
      redirect("/login");
    }

    throw error;
  }
}
