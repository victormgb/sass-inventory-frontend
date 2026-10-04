import type { FieldErrors } from "@/lib/types";

export type InviteState = {
  errors: FieldErrors;
  message?: string;
  success?: string;
};

/**
 * Not a "use server" module: a "use server" file may only export async
 * functions, so a plain value exported from one imports as undefined on the
 * client.
 */
export const initialInviteState: InviteState = { errors: {} };

export type RevokeState = {
  message?: string;
  error?: string;
};

export const initialRevokeState: RevokeState = {};
