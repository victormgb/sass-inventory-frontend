import type { FieldErrors } from "@/lib/types";

export type RegisterState = {
  errors: FieldErrors;
  message?: string;
};

/**
 * Not a "use server" module: a "use server" file may only export async
 * functions, so a plain value exported from one imports as undefined on the
 * client.
 */
export const initialRegisterState: RegisterState = { errors: {} };
