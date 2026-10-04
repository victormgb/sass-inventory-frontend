"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiCreateInvitation, apiRevokeInvitation } from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/roles";
import type { CreateInvitationResponse, OrganizationRole } from "@/lib/types";

import type { InviteState, RevokeState } from "./state";

/**
 * The tenant always comes from the session, never from the form: a hidden
 * field carrying it would be editable by the user, and the server would then
 * invite into an organization they do not belong to.
 */
export async function inviteAction(
  _previous: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const session = await readSession();

  if (!session) {
    return { errors: {}, message: "Tu sesion ha caducado. Vuelve a entrar." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").toUpperCase() as OrganizationRole;

  if (!email) {
    return { errors: { email: ["El correo es obligatorio."] } };
  }

  if (!role) {
    return { errors: { role: ["Elige un rol."] } };
  }

  try {
    const response = await apiCreateInvitation<CreateInvitationResponse>(session, { email, role });

    revalidatePath(`/app/${session.tenantSlug}/equipo`);

    return {
      errors: {},
      success: `Invitacion enviada a ${response.data.email} como ${ROLE_LABELS[role]}.`,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { errors: {}, message: "Tu rol no puede invitar a este usuario." };
      }

      if (error.status === 422) {
        return { errors: error.fieldErrors };
      }

      return { errors: {}, message: error.message };
    }

    throw error;
  }
}

export async function revokeAction(
  _previous: RevokeState,
  formData: FormData,
): Promise<RevokeState> {
  const session = await readSession();

  if (!session) {
    return { error: "Tu sesion ha caducado. Vuelve a entrar." };
  }

  const invitationId = Number(formData.get("invitation_id"));

  if (!Number.isInteger(invitationId)) {
    return { error: "Invitacion no valida." };
  }

  try {
    await apiRevokeInvitation(session, invitationId);

    revalidatePath(`/app/${session.tenantSlug}/equipo`);

    return { message: "Invitacion revocada." };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { error: "Tu rol no puede revocar invitaciones." };
      }

      return { error: error.message };
    }

    throw error;
  }
}
