"use server";

import { redirect } from "next/navigation";

import { ApiError, apiAcceptInvitation } from "@/lib/api/laravel";
import { tenantDashboardPath } from "@/lib/auth/redirect-path";
import { writeSession } from "@/lib/auth/session";
import { getTranslate } from "@/lib/i18n/server";
import type { AcceptInvitationResponse } from "@/lib/types";

import type { AcceptState } from "./state";

/**
 * The token comes from a hidden field, so it is validated as untrusted input
 * before it reaches the API. Laravel re-derives the hash regardless.
 */
export async function acceptInvitationAction(
  _previous: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const t = await getTranslate();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirmation = String(formData.get("password_confirmation") ?? "");

  if (!token) {
    return { errors: {}, message: t("invitations.invalidLink") };
  }

  if (password !== passwordConfirmation) {
    return { errors: { password_confirmation: [t("invitations.passwordMismatch")] } };
  }

  let response: AcceptInvitationResponse;

  try {
    response = await apiAcceptInvitation<AcceptInvitationResponse>({
      token,
      full_name: String(formData.get("full_name") ?? "").trim(),
      password,
      password_confirmation: passwordConfirmation,
    });

    // Laravel issues a Sanctum token on accept, so the invitee lands in the
    // private area exactly like a user who went through /register.
    await writeSession(response.token, response.organization.slug);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        return {
          errors: {},
          message: t("invitations.accountExists"),
        };
      }

      if (error.status === 410) {
        return {
          errors: {},
          message: t("invitations.noLongerValid"),
        };
      }

      if (error.status === 422) {
        return { errors: error.fieldErrors };
      }

      if (error.status === 404) {
        return { errors: {}, message: t("invitations.invalidLink") };
      }

      return { errors: {}, message: error.message };
    }

    throw error;
  }

  // Outside the try: redirect() throws to signal control flow, and catching it
  // would turn a successful accept into an error page.
  redirect(tenantDashboardPath(response.organization.slug));
}
