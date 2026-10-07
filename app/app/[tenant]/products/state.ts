import type { FieldErrors } from "@/lib/types";

export type ProductFormState = {
  errors: FieldErrors;
  message?: string;
  success?: string;
};

/**
 * Not a "use server" module: a "use server" file may only export async
 * functions, so a plain value exported from one imports as undefined on the
 * client.
 */
export const initialProductFormState: ProductFormState = { errors: {} };

export type DeleteProductState = {
  message?: string;
  error?: string;
};

export const initialDeleteProductState: DeleteProductState = {};