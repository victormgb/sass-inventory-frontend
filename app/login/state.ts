import type { FieldErrors, SessionOrganization } from "@/lib/types";

export type LoginState = {
  errors: FieldErrors;
  message?: string;
  /**
   * Set after a successful password check when the account belongs to more than
   * one organization. The session already exists at this point (the token can only
   * be stored in an httpOnly cookie), it is just pointed at the default
   * organization until the user picks one.
   */
  organizations?: SessionOrganization[];
};

/**
 * Not a "use server" module: a "use server" file may only export async functions,
 * so a plain value exported from one imports as undefined on the client.
 */
export const initialLoginState: LoginState = { errors: {} };