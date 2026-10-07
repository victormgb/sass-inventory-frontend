"use client";

import { useActionState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/lib/i18n/provider";

import { deleteProductAction } from "./actions";
import { initialDeleteProductState } from "./state";

type ProductRowActionsProps = {
  productId: number;
  sku: string;
  name: string;
  returnQuery: string;
  editHref: string;
};

/**
 * Destructive, so it asks first. `window.confirm` is used deliberately: the
 * alternative is a dialog component with its own pending and error state for a
 * single yes/no, and this is the only irreversible action in the catalog.
 */
export function ProductRowActions({
  productId,
  sku,
  name,
  returnQuery,
  editHref,
}: ProductRowActionsProps) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(
    deleteProductAction,
    initialDeleteProductState,
  );

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={editHref}
        aria-label={t("products.editAriaLabel", { name })}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-100"
      >
        <Pencil className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t("products.editLabel")}</span>
      </Link>

      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(t("products.confirmDelete", { sku, name }))) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="return_query" value={returnQuery} />

        <button
          type="submit"
          disabled={pending}
          aria-label={t("products.deleteAriaLabel", { name })}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{t("products.deleteLabel")}</span>
        </button>
      </form>

      <span role="status" aria-live="polite" className="text-xs">
        {state.error ? (
          <span className="text-red-600 dark:text-red-400">{state.error}</span>
        ) : state.message ? (
          <span className="text-emerald-600 dark:text-emerald-400">{state.message}</span>
        ) : null}
      </span>
    </div>
  );
}