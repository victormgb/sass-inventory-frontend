"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiDeleteOrganization, apiRemoveOrganizationLogo, apiUpdateOrganization, apiUploadOrganizationLogo } from "@/lib/api/laravel";
import { tenantDashboardPath } from "@/lib/auth/redirect-path";
import { readSession, clearSession, writeSession } from "@/lib/auth/session";
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
 * Mirrors the server's max:2048 on the upload. It is a courtesy, not the gate: the
 * API validates the same cap and remains the only thing that decides. Checking here
 * just saves the round trip and explains the limit before the file is sent.
 */
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

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
        return { error: "Solo un administrador puede cambiar estos ajustes." };
      }
    }

    return { error: "No se pudieron guardar los cambios." };
  }

  revalidatePath(`/app/${session.tenantSlug}`, "layout");

  return { success: "Cambios guardados." };
}

/**
 * Uploads a logo file. The file never reaches the browser's own storage and the URL
 * that gets saved is one Laravel minted, so unlike the logo_url field a user cannot
 * point the tenant's logo at an address of their choosing.
 */
export async function uploadOrganizationLogoAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  const file = formData.get("logo");

  if (!(file instanceof File) || file.size === 0) {
    return { fieldErrors: { logo: ["Selecciona una imagen."] } };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return {
      fieldErrors: { logo: ["La imagen supera el límite de 2 MB."] },
    };
  }

  const body = new FormData();
  body.set("logo", file);

  try {
    console.log("Uploading logo for organization", session.tenantSlug, "with file", file.name, "size", file.size);
    await apiUploadOrganizationLogo<UpdateOrganizationResponse>(session, body);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 422) {
        return { fieldErrors: error.fieldErrors };
      }

      if (error.status === 403) {
        return { error: "Solo un administrador puede cambiar el logo." };
      }

      if (error.status === 413 || error.status === 429) {
        return { error: "Demasiadas subidas seguidas. Espera un momento." };
      }
    }

    return { error: "No se pudo subir el logo. Inténtalo de nuevo." };
  }

  revalidatePath(`/app/${session.tenantSlug}`, "layout");

  return { success: "Logo actualizado." };
}

/**
 * Clears the logo: the column goes null and the object Laravel wrote is deleted.
 *
 * Takes no arguments on purpose. The form carries no fields, and a useActionState
 * action is free to ignore the state and the payload it is handed.
 */
export async function removeOrganizationLogoAction(): Promise<SettingsState> {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  try {
    await apiRemoveOrganizationLogo<UpdateOrganizationResponse>(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return { error: "Solo un administrador puede quitar el logo." };
    }

    return { error: "No se pudo quitar el logo." };
  }

  revalidatePath(`/app/${session.tenantSlug}`, "layout");

  return { success: "Logo eliminado." };
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
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  const confirmation = String(formData.get("confirm_name") ?? "").trim();

  // Checked here as well as in the UI: the confirmation is the only thing standing
  // between a stray click and an unrecoverable delete.
  if (confirmation !== session.tenantSlug) {
    return {
      error: `Escribe "${session.tenantSlug}" para confirmar el borrado.`,
    };
  }

  let deleted: DeleteOrganizationResponse;

  try {
    deleted = await apiDeleteOrganization<DeleteOrganizationResponse>(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return { error: "Solo un administrador puede eliminar la organización." };
    }

    return { error: "No se pudo eliminar la organización." };
  }

  const remaining = deleted.organizations[0];

  if (!remaining) {
    await clearSession();
    redirect("/login");
  }

  await writeSession(session.token, remaining.slug);
  redirect(tenantDashboardPath(remaining.slug));
}