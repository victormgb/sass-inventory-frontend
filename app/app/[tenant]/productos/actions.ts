"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ApiError,
  apiCreateProduct,
  apiDeleteProduct,
  apiUpdateProduct,
} from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import type { FieldErrors, ProductPayload, ProductResponse } from "@/lib/types";

import type { DeleteProductState, ProductFormState } from "./state";

/**
 * Query strings are rebuilt from a fixed whitelist rather than trusted, so a
 * tampered `return_query` cannot turn a redirect into an off-site hop. The
 * leading `?` is mandatory: without it the value could carry its own path or a
 * protocol-relative `//host`.
 */
const SAFE_QUERY = /^\?[A-Za-z0-9=&%._-]*$/;

function catalogUrl(tenantSlug: string, returnQuery?: unknown): string {
  const base = `/app/${tenantSlug}/productos`;
  const candidate = typeof returnQuery === "string" ? returnQuery.trim() : "";

  return SAFE_QUERY.test(candidate) ? `${base}${candidate}` : base;
}

const EXPIRED = "Tu sesion ha caducado. Vuelve a entrar.";

/**
 * `edit` is only used to tell create from update. It never names a tenant and
 * never picks the organization: that comes from the session, because a hidden
 * field is editable by the user.
 */
function editedId(formData: FormData): number {
  const id = Number(formData.get("product_id") ?? 0);

  return Number.isInteger(id) && id > 0 ? id : 0;
}

/**
 * Numbers are parsed here rather than sent as raw strings: the integer columns
 * must not arrive as "12.5" or "", and catching it here saves a round trip only
 * to be told the same thing by Laravel's 422.
 */
function buildPayload(formData: FormData): { payload?: ProductPayload; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim().replace(",", ".");
  const costPrice = String(formData.get("cost_price") ?? "").trim().replace(",", ".");
  const stock = Number(formData.get("current_stock"));
  const minStock = Number(formData.get("min_stock_alert"));

  if (!sku) {
    errors.sku = ["El SKU es obligatorio."];
  }

  if (!name) {
    errors.name = ["El nombre es obligatorio."];
  }

  if (!/^\d+(\.\d{1,2})?$/.test(price)) {
    errors.price = ["Introduce un precio valido, por ejemplo 12.50."];
  }

  if (!/^\d+(\.\d{1,2})?$/.test(costPrice)) {
    errors.cost_price = ["Introduce un coste valido, por ejemplo 6.00."];
  }

  if (!Number.isInteger(stock) || stock < 0) {
    errors.current_stock = ["El stock debe ser un entero igual o mayor que cero."];
  }

  if (!Number.isInteger(minStock) || minStock < 0) {
    errors.min_stock_alert = ["El aviso de stock debe ser un entero igual o mayor que cero."];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    payload: {
      sku,
      name,
      description: description === "" ? null : description,
      price,
      cost_price: costPrice,
      current_stock: stock,
      min_stock_alert: minStock,
    },
  };
}

export async function saveProductAction(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await readSession();

  if (!session) {
    return { errors: {}, message: EXPIRED };
  }

  const { payload, errors } = buildPayload(formData);

  if (!payload) {
    return { errors };
  }

  const id = editedId(formData);
  const destination = catalogUrl(session.tenantSlug, formData.get("return_query"));

  try {
    const response =
      id > 0
        ? await apiUpdateProduct<ProductResponse>(session, id, payload)
        : await apiCreateProduct<ProductResponse>(session, payload);

    revalidatePath(`/app/${session.tenantSlug}/productos`);

    // Landing back on the clean URL drops `edit`, so the form returns to create
    // mode instead of staying pinned to the row that was just saved.
    redirect(destination);

    return {
      errors: {},
      success: id > 0
        ? `Producto ${response.data.sku} actualizado.`
        : `Producto ${response.data.sku} creado.`,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { errors: {}, message: "Tu rol no puede modificar el catalogo." };
      }

      if (error.status === 404) {
        return { errors: {}, message: "Ese producto ya no existe." };
      }

      if (error.status === 422) {
        return { errors: error.fieldErrors };
      }

      return { errors: {}, message: error.message };
    }

    throw error;
  }
}

export async function deleteProductAction(
  _previous: DeleteProductState,
  formData: FormData,
): Promise<DeleteProductState> {
  const session = await readSession();

  if (!session) {
    return { error: EXPIRED };
  }

  const id = Number(formData.get("product_id"));
  const destination = catalogUrl(session.tenantSlug, formData.get("return_query"));

  if (!Number.isInteger(id) || id <= 0) {
    return { error: "Producto no valido." };
  }

  try {
    await apiDeleteProduct(session, id);

    revalidatePath(`/app/${session.tenantSlug}/productos`);

    // Page is deliberately not preserved: deleting the last row of page 5 would
    // otherwise leave an empty page 5.
    redirect(destination);

    return { message: "Producto eliminado." };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { error: "Tu rol no puede eliminar productos." };
      }

      if (error.status === 404) {
        return { error: "Ese producto ya no existe." };
      }

      return { error: error.message };
    }

    throw error;
  }
}