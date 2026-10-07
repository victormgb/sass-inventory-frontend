"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiDeleteOrganization, apiRemoveOrganizationLogo, apiUpdateOrganization } from "@/lib/api/laravel";
import { tenantDashboardPath } from "@/lib/auth/redirect-path";
import { readSession, clearSession, writeSession } from "@/lib/auth/session";
import { getTranslate } from "@/lib/i18n/server";
import type {
  DeleteOrganizationResponse,
  FieldErrors,
  UpdateOrganizationResponse,
} from "@/lib/types";

export type SettingsState = {
  error?: string;
  fieldErrors?: FieldErrors;
  success?: string;
};

/**
 * Renames the organization.
 *
 * The session is not rewritten here: the slug does not change on rename, so the
 * tenant cookie stays valid and nothing needs to move. Only the cached pages have
 * to be re-read, since the sidebar and header render the name.
 */
export async function updateOrganizationAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const name = String(formData.get("name") ?? "").trim();
  const t = await getTranslate();

  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await apiUpdateOrganization<UpdateOrganizationResponse>(session, { name });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 422) {
        return { fieldErrors: error.fieldErrors };
      }

      if (error.status === 403) {
        return { error: t("settings.saveForbidden") };
      }
    }

    return { error: t("settings.saveFailed") };
  }

  revalidatePath(`/app/${session.tenantSlug}`, "layout");

  return { success: t("settings.saved") };
}

/**
 * Clears the logo: the column goes null and the object Laravel wrote is deleted.
 *
 * Takes no arguments on purpose. The form carries no fields, and a useActionState
 * action is free to ignore the state and the payload it is handed.
 */
export async function removeOrganizationLogoAction(): Promise<SettingsState> {
  const t = await getTranslate();
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await apiRemoveOrganizationLogo<UpdateOrganizationResponse>(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return { error: t("settings.removeForbidden") };
    }

    return { error: t("settings.removeFailed") };
  }

  revalidatePath(`/app/${session.tenantSlug}`, "layout");

  return { success: t("settings.logo.removed") };
}

/**
 * Deletes the active organization and lands the user somewhere that still exists.
 *
 * The token is user-wide and survives, so somebody who belonged to two
 * organizations stays signed in to the one left. With no organization left there
 * is nothing to sign in to, and the session is cleared rather than left pointing
 * at a slug the API will now answer 404.
 */
export async function deleteOrganizationAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const t = await getTranslate();
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  const confirmation = String(formData.get("confirm_name") ?? "").trim();

  // Checked here as well as in the UI: the confirmation is the only thing standing
  // between a stray click and an unrecoverable delete.
  if (confirmation !== session.tenantSlug) {
    return {
      error: t("settings.confirmMismatch", { slug: session.tenantSlug }),
    };
  }

  let deleted: DeleteOrganizationResponse;

  try {
    deleted = await apiDeleteOrganization<DeleteOrganizationResponse>(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return { error: t("settings.deleteForbidden") };
    }

    return { error: t("settings.deleteFailed") };
  }

  const remaining = deleted.organizations[0];

  if (!remaining) {
    await clearSession();
    redirect("/login");
  }

  await writeSession(session.token, remaining.slug);
  redirect(tenantDashboardPath(remaining.slug));
}