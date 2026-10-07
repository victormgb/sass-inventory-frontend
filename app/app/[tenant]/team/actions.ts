"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiCreateInvitation, apiRevokeInvitation } from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import { roleLabel } from "@/lib/roles";
import { getTranslate } from "@/lib/i18n/server";
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
  const t = await getTranslate();
  const session = await readSession();

  if (!session) {
    return { errors: {}, message: t("errors.sessionExpired") };
  }

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").toUpperCase() as OrganizationRole;

  if (!email) {
    return { errors: { email: [t("team.invite.emailRequired")] } };
  }

  if (!role) {
    return { errors: { role: [t("team.invite.roleRequired")] } };
  }

  try {
    const response = await apiCreateInvitation<CreateInvitationResponse>(session, { email, role });

    revalidatePath(`/app/${session.tenantSlug}/team`);

    return {
      errors: {},
      success: t("team.invite.sent", { email: response.data.email, role: roleLabel(role, t) }),
      inviteUrl: response.accept_url,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { errors: {}, message: t("errors.unauthorized") };
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
  const t = await getTranslate();
  const session = await readSession();

  if (!session) {
    return { error: t("errors.sessionExpired") };
  }

  const invitationId = Number(formData.get("invitation_id"));

  if (!Number.isInteger(invitationId)) {
    return { error: t("team.pending.revokeInvalid") };
  }

  try {
    await apiRevokeInvitation(session, invitationId);

    revalidatePath(`/app/${session.tenantSlug}/team`);

    return { message: t("team.pending.revokeSuccess") };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { error: t("errors.unauthorized") };
      }

      return { error: error.message };
    }

    throw error;
  }
}
