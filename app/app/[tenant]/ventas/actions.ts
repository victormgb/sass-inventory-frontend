"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiCreateSale, apiProducts } from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import type {
  CreateSalePayload,
  FieldErrors,
  PaymentMethod,
  Product,
  ProductsResponse,
  SaleResponse,
} from "@/lib/types";

import type { SaleFormState, SaleProductResult } from "./state";

const EXPIRED = "Tu sesion ha caducado. Vuelve a entrar.";

/** The till only ever looks at the first screenful of matches. */
const SEARCH_LIMIT = 25;

const PAYMENT_METHODS: readonly PaymentMethod[] = ["CASH", "CARD", "TRANSFER"];

/**
 * Lines travel as indexed FormData entries (items[0][product_id]) rather than a
 * JSON blob, so the submission stays a plain form post and the browser's own
 * required-field semantics keep working.
 */
const LINE_KEY = /^items\[(\d+)\]\[(product_id|quantity)\]$/;

type RawLine = { product_id?: string; quantity?: string };

/**
 * Collected by index instead of appended in encounter order: two inputs of the
 * same line arrive next to each other, so a single pass over the entries is
 * enough and the line order stays the order the cashier built the sale in.
 */
function collectLines(formData: FormData): RawLine[] {
  const byIndex = new Map<number, RawLine>();

  for (const [key, value] of formData.entries()) {
    const match = LINE_KEY.exec(key);

    if (!match) {
      continue;
    }

    const index = Number(match[1]);
    const line = byIndex.get(index) ?? {};

    if (match[2] === "product_id") {
      line.product_id = String(value);
    } else {
      line.quantity = String(value);
    }

    byIndex.set(index, line);
  }

  return [...byIndex.entries()].sort(([a], [b]) => a - b).map(([, line]) => line);
}

/**
 * Parsed here instead of posting raw strings: an empty quantity would arrive as
 * "" and the integer column has to not see it, and catching it here saves a round
 * trip only to be told the same thing by Laravel's 422.
 */
function buildPayload(formData: FormData): { payload?: CreateSalePayload; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const paymentMethod = String(formData.get("payment_method") ?? "");
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const lines: CreateSalePayload["items"] = [];

  if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
    errors.payment_method = ["Selecciona como se ha cobrado la venta."];
  }

  const raw = collectLines(formData);

  if (raw.length === 0) {
    errors.items = ["Anade al menos un producto a la venta."];
  }

  raw.forEach((line, index) => {
    const productId = Number(line.product_id);
    const quantity = Number(line.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      errors[`items.${index}.product_id`] = ["Producto no valido."];
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
      errors[`items.${index}.quantity`] = ["La cantidad debe ser un entero de 1 a 10000."];
    }

    if (Number.isInteger(productId) && productId > 0 && Number.isInteger(quantity) && quantity > 0) {
      lines.push({ product_id: productId, quantity });
    }
  });

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    payload: {
      payment_method: paymentMethod as PaymentMethod,
      customer_name: customerName === "" ? null : customerName,
      items: lines,
    },
  };
}

export async function createSaleAction(
  _previous: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  const session = await readSession();

  if (!session) {
    return { errors: {}, message: EXPIRED };
  }

  const { payload, errors } = buildPayload(formData);

  if (!payload) {
    return { errors };
  }

  try {
    const response = await apiCreateSale<SaleResponse>(session, payload);

    // The dashboard reads today's revenue, so it has to be revalidated too, not
    // only the sales list.
    revalidatePath(`/app/${session.tenantSlug}/ventas`);
    revalidatePath(`/app/${session.tenantSlug}/dashboard`);
    revalidatePath(`/app/${session.tenantSlug}/productos`);

    redirect(`/app/${session.tenantSlug}/ventas/${response.data.id}`);

    return { errors: {}, success: `Venta ${response.data.order_number} registrada.` };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { errors: {}, message: "Tu rol no puede registrar ventas." };
      }

      if (error.status === 422) {
        // Stock and unknown products both arrive here: the cashier changed the
        // quantities or somebody else sold the stock first.
        return { errors: error.fieldErrors };
      }

      return { errors: {}, message: error.message };
    }

    throw error;
  }
}

/**
 * Backs the product picker. It goes through the regular catalog endpoint, so the
 * results are tenant-scoped and role-checked exactly like the catalog page.
 */
export async function searchSaleProductsAction(term: string): Promise<SaleProductResult[]> {
  const session = await readSession();

  if (!session) {
    return [];
  }

  const search = term.trim().slice(0, 120);

  if (search === "") {
    return [];
  }

  try {
    const response = await apiProducts<ProductsResponse>(session, {
      q: search,
      per_page: SEARCH_LIMIT,
      sort: "name",
      direction: "asc",
    });

    return response.data.map((product: Product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      current_stock: product.current_stock,
    }));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return [];
    }

    throw error;
  }
}