import type { FieldErrors } from "@/lib/types";

export type InviteState = {
  errors: FieldErrors;
  message?: string;
  success?: string;
  /**
   * Accept link of the invitation just issued, or absent if this round failed.
   *
   * It only exists for the moment the invite was created: the backend stores the
   * token's hash, so a refresh or a later action cannot recover it. Returning it
   * inside the action state is what gives the form a URL to copy without any extra
   * request, and it is deliberately dropped on every error path so a stale link
   * never sits next to a message about a different invite.
   */
  inviteUrl?: string;
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
