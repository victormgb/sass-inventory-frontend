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
import { getTranslate } from "@/lib/i18n/server";
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
  const base = `/app/${tenantSlug}/products`;
  const candidate = typeof returnQuery === "string" ? returnQuery.trim() : "";

  return SAFE_QUERY.test(candidate) ? `${base}${candidate}` : base;
}



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
async function buildPayload(formData: FormData): Promise<{ payload?: ProductPayload; errors: FieldErrors }> {
  const t = await getTranslate();
  const errors: FieldErrors = {};

  const sku = String(formData.get("sku") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim().replace(",", ".");
  const costPrice = String(formData.get("cost_price") ?? "").trim().replace(",", ".");
  const stock = Number(formData.get("current_stock"));
  const minStock = Number(formData.get("min_stock_alert"));

  if (!sku) {
    errors.sku = [t("products.errorSkuRequired")];
  }

  if (!name) {
    errors.name = [t("products.errorNameRequired")];
  }

  if (!/^\d+(\.\d{1,2})?$/.test(price)) {
    errors.price = [t("products.errorPriceInvalid")];
  }

  if (!/^\d+(\.\d{1,2})?$/.test(costPrice)) {
    errors.cost_price = [t("products.errorCostInvalid")];
  }

  if (!Number.isInteger(stock) || stock < 0) {
    errors.current_stock = [t("products.errorStockInvalid")];
  }

  if (!Number.isInteger(minStock) || minStock < 0) {
    errors.min_stock_alert = [t("products.errorLowStockAlertInvalid")];
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
  const t = await getTranslate();

  if (!session) {
    return { errors: {}, message: t("errors.sessionExpired") };
  }

  const { payload, errors } = await buildPayload(formData);

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

    revalidatePath(`/app/${session.tenantSlug}/products`);

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
        return { errors: {}, message: t("products.errorRoleCannotEdit") };
      }

      if (error.status === 404) {
        return { errors: {}, message: t("products.errorNotFound") };
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
  const t = await getTranslate();

  if (!session) {
    return { error: t("errors.sessionExpired") };
  }

  const id = Number(formData.get("product_id"));
  const destination = catalogUrl(session.tenantSlug, formData.get("return_query"));

  if (!Number.isInteger(id) || id <= 0) {
    return { error: t("products.errorInvalidProduct") };
  }

  try {
    await apiDeleteProduct(session, id);

    revalidatePath(`/app/${session.tenantSlug}/products`);

    // Page is deliberately not preserved: deleting the last row of page 5 would
    // otherwise leave an empty page 5.
    redirect(destination);

    return { message: "Producto eliminado." };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 403) {
        return { error: t("products.errorRoleCannotDelete") };
      }

      if (error.status === 404) {
        return { error: t("products.errorNotFound") };
      }

      return { error: error.message };
    }

    throw error;
  }
}