import type { FieldErrors } from "@/lib/types";

export type AcceptState = {
  errors: FieldErrors;
  message?: string;
};

/**
 * Not a "use server" module: a "use server" file may only export async
 * functions, so a plain value exported from one imports as undefined on the
 * client.
 */
export const initialAcceptState: AcceptState = { errors: {} };
