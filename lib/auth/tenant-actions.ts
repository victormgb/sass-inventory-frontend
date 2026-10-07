"use server";

import { redirect } from "next/navigation";

import { ApiError, apiMe } from "@/lib/api/laravel";
import { getTranslate } from "@/lib/i18n/server";
import type { MeResponse } from "@/lib/types";

import { tenantDashboardPath } from "./redirect-path";
import { clearSession, readSession, writeSession } from "./session";

export type SwitchTenantState = {
  error?: string;
};

/**
 * Moves the session to another organization the user belongs to.
 *
 * The slug arrives from the browser, so it is never trusted on its own: the
 * membership list comes back from /auth/me and the switch only happens if the
 * target is actually in it. Without that check this action would be a tenant
 * probe, letting anyone point their session at an arbitrary slug and enumerate
 * which organizations exist by the error they get.
 *
 * /auth/me is called with the *current* tenant on purpose. It needs a tenant it
 * can resolve, and the current one is already known to be valid, so this works
 * even when the caller has never had a valid session.
 */
export async function switchTenantAction(
  _state: SwitchTenantState,
  formData: FormData,
): Promise<SwitchTenantState> {
  const slug = String(formData.get("slug") ?? "").trim();
  const t = await getTranslate();

  if (!slug) {
    return { error: t("organizations.switchMissing") };
  }

  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  let me: MeResponse;

  try {
    me = await apiMe<MeResponse>(session);
  } catch (error) {
    // A rejected token, or a tenant the user is no longer a member of, leaves a
    // cookie that can never work. requireSession() clears it on the next page
    // load, but this action does not navigate, so it has to do it here or the user
    // sits with a dead session.
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      await clearSession();
      redirect("/login");
    }

    return { error: t("organizations.switchCheckFailed") };
  }

  if (!me.organizations.some((organization) => organization.slug === slug)) {
    return { error: t("organizations.switchNotMember") };
  }

  // No new token: the Sanctum token is user-wide, not tenant-bound, so only the
  // tenant cookie moves.
  await writeSession(session.token, slug);

  redirect(tenantDashboardPath(slug));
}