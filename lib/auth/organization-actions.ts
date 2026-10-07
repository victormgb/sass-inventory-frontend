"use server";

import { redirect } from "next/navigation";

import { ApiError, apiCreateOrganization } from "@/lib/api/laravel";
import { readSession, writeSession } from "@/lib/auth/session";
import { getTranslate } from "@/lib/i18n/server";
import type { CreateOrganizationResponse, FieldErrors } from "@/lib/types";

import { tenantDashboardPath } from "./redirect-path";

export type CreateOrganizationState = {
  error?: string;
  fieldErrors?: FieldErrors;
};

/**
 * Creates an organization owned by the signed-in user and moves the session into
 * it.
 *
 * Anyone may do this: it is not a privilege inside the current tenant, it is how
 * somebody who does not have one yet ends up with one. The API decides that, so
 * there is no role check here.
 */
export async function createOrganizationAction(
  _state: CreateOrganizationState,
  formData: FormData,
): Promise<CreateOrganizationState> {
  const name = String(formData.get("name") ?? "").trim();
  const t = await getTranslate();

  if (!name) {
    return { fieldErrors: { name: [t("organizations.nameRequired")] } };
  }

  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  let created: CreateOrganizationResponse;

  try {
    created = await apiCreateOrganization<CreateOrganizationResponse>(
      { token: session.token },
      { name },
    );
  } catch (error) {
    const fieldErrors = extractFieldErrors(error);

    if (fieldErrors) {
      return { fieldErrors };
    }

    return { error: t("organizations.createFailed") };
  }

  // Land in the new organization instead of the one the form was opened from: the
  // point of creating it is to use it.
  await writeSession(session.token, created.data.slug);

  redirect(tenantDashboardPath(created.data.slug));
}

/**
 * Laravel validation arrives as 422 with a `errors` object, which laravelFetch
 * already unpacked into ApiError.fieldErrors. Anything else (401, 500) is not a
 * field-level complaint and must not be shown as one.
 */
function extractFieldErrors(error: unknown): FieldErrors | null {
  if (error instanceof ApiError && error.status === 422) {
    return Object.keys(error.fieldErrors).length > 0 ? error.fieldErrors : null;
  }

  return null;
}