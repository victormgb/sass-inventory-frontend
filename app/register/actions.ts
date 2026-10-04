"use server";

import { redirect } from "next/navigation";

import { ApiError, apiRegister } from "@/lib/api/laravel";
import { tenantDashboardPath } from "@/lib/auth/redirect-path";
import { writeSession } from "@/lib/auth/session";
import type { RegisterResponse } from "@/lib/types";

import type { RegisterState } from "./state";

export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const payload = {
    full_name: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    password_confirmation: String(formData.get("password_confirmation") ?? ""),
    organization_name: String(formData.get("organization_name") ?? ""),
  };

  let tenantSlug: string;

  try {
    const data = await apiRegister<RegisterResponse>(payload);
    await writeSession(data.token, data.organization.slug);
    tenantSlug = data.organization.slug;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 422) {
        return { errors: error.fieldErrors };
      }

      return { errors: {}, message: error.message };
    }

    throw error;
  }

  // Outside the try: redirect() signals control flow by throwing, and catching
  // it here would turn a successful registration into an error page.
  redirect(tenantDashboardPath(tenantSlug));
}
