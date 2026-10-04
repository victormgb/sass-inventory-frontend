"use server";

import { redirect } from "next/navigation";

import { ApiError, apiLogin } from "@/lib/api/laravel";
import { safeRedirectPath } from "@/lib/auth/redirect-path";
import { writeSession } from "@/lib/auth/session";
import type { LoginResponse } from "@/lib/types";

import type { LoginState } from "./state";

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const organizationSlug = String(formData.get("organization_slug") ?? "").trim();
  const requestedPath = safeRedirectPath(formData.get("next"));

  const payload = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    ...(organizationSlug === "" ? {} : { organization_slug: organizationSlug }),
  };

  let data: LoginResponse;

  try {
    data = await apiLogin<LoginResponse>(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 422) {
        return { errors: error.fieldErrors };
      }

      if (error.status === 429) {
        return {
          errors: {},
          message: "Demasiados intentos fallidos. Espera un minuto antes de reintentar.",
        };
      }

      return { errors: {}, message: error.message };
    }

    throw error;
  }

  await writeSession(data.token, data.organization.slug);

  const tenantSlug = data.organization.slug;

  // More than one membership and no explicit choice: let the user pick instead of
  // silently dropping them into the most recent one. The session is already
  // written because the token has nowhere else to live, and the picker reuses
  // switchTenantAction to move it.
  if (organizationSlug === "" && data.organizations.length > 1) {
    return { errors: {}, organizations: data.organizations };
  }

  // A deep link only survives if it points at the tenant the login landed in;
  // otherwise the proxy would bounce it straight back to the dashboard.
  const destination = requestedPath === null || !requestedPath.startsWith(`/app/${tenantSlug}/`)
    ? `/app/${tenantSlug}/dashboard`
    : requestedPath;

  // Outside the try: redirect() signals control flow by throwing, and catching
  // it here would turn a successful login into an error page.
  redirect(destination);
}