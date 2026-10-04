"use client";

import { useActionState } from "react";
import {
  AlertCircle,
  BellRing,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Receipt,
  ScanBarcode,
  Tag,
} from "lucide-react";
import Link from "next/link";

import { FormField, TextAreaField } from "@/components/ui/form-field";
import type { Product } from "@/lib/types";

import { saveProductAction } from "./actions";
import { initialProductFormState } from "./state";

type ProductFormProps = {
  tenant: string;
  /** Present when editing; absent when creating. */
  product: Product | null;
  returnQuery?: string;
};

export function ProductForm({ tenant, product, returnQuery }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(saveProductAction, initialProductFormState);

  const isEdit = product !== null;
  const title = isEdit ? `Editar ${product.sku}` : "Nuevo producto";

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="product_id" value={product?.id ?? ""} />
      <input type="hidden" name="return_query" value={returnQuery ?? ""} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {isEdit
              ? "Los cambios se aplican al instante."
              : "El SKU es unico dentro de esta organizacion."}
          </p>
        </div>

        {isEdit ? (
          <Link
            href={`/app/${tenant}/productos`}
            className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancelar
          </Link>
        ) : null}
      </div>

      <div aria-live="polite">
        {state.message ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </p>
        ) : null}

        {state.success ? (
          <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.success}</span>
          </p>
        ) : null}
      </div>

      <FormField
        id="product-sku"
        name="sku"
        label="SKU"
        icon={ScanBarcode}
        required
        defaultValue={product?.sku}
        placeholder="REF-1"
        hint="Solo letras, numeros, punto, guion y guion bajo."
        errors={state.errors.sku}
      />

      <FormField
        id="product-name"
        name="name"
        label="Nombre"
        icon={Tag}
        required
        defaultValue={product?.name}
        placeholder="Cafe molido 250g"
        errors={state.errors.name}
      />

      <TextAreaField
        id="product-description"
        name="description"
        label="Descripcion"
        placeholder="Paquete de 250g, molido medio."
        defaultValue={product?.description ?? ""}
        hint="Opcional."
        errors={state.errors.description}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="product-price"
          name="price"
          label="Precio de venta"
          icon={CircleDollarSign}
          type="text"
          inputMode="decimal"
          required
          defaultValue={product?.price}
          placeholder="12.50"
          errors={state.errors.price}
        />

        <FormField
          id="product-cost-price"
          name="cost_price"
          label="Coste"
          icon={Receipt}
          type="text"
          inputMode="decimal"
          required
          defaultValue={product?.cost_price}
          placeholder="6.00"
          hint="Se usa para calcular el margen."
          errors={state.errors.cost_price}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="product-current-stock"
          name="current_stock"
          label="Stock actual"
          icon={Boxes}
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          required
          defaultValue={product ? String(product.current_stock) : ""}
          errors={state.errors.current_stock}
        />

        <FormField
          id="product-min-stock-alert"
          name="min_stock_alert"
          label="Aviso de stock bajo"
          icon={BellRing}
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          required
          defaultValue={product ? String(product.min_stock_alert) : ""}
          hint="Por debajo de este valor salimos en el filtro."
          errors={state.errors.min_stock_alert}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Guardando...
          </>
        ) : (
          <>{isEdit ? "Guardar cambios" : "Crear producto"}</>
        )}
      </button>
    </form>
  );
}