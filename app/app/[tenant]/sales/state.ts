import type { FieldErrors } from "@/lib/types";

export type SaleFormState = {
  errors: FieldErrors;
  message?: string;
  success?: string;
};

/**
 * Not a "use server" module: a "use server" file may only export async
 * functions, so a plain value exported from one imports as undefined on the
 * client.
 */
export const initialSaleFormState: SaleFormState = { errors: {} };

/**
 * The cart lives on the client so the till can add lines without a round trip,
 * but the server recomputes every amount. `unit_price` is carried only to render
 * the running total; it is never sent as authoritative input.
 */
export type SaleCartLine = {
  product_id: number;
  sku: string;
  name: string;
  unit_price: string;
  quantity: number;
  available: number;
};

export type SaleProductResult = {
  id: number;
  sku: string;
  name: string;
  price: string;
  current_stock: number;
};