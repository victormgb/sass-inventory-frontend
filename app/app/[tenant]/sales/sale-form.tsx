"use client";

import { useActionState, useState, useTransition } from "react";
import {
  AlertCircle,
  BadgeEuro,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";

import { FormField } from "@/components/ui/form-field";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/config";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/types";

import { createSaleAction, searchSaleProductsAction } from "./actions";
import { initialSaleFormState, type SaleCartLine, type SaleProductResult } from "./state";

/**
 * The running total is a preview only. Every amount on screen comes from the
 * catalog the server loaded, and SaleRegistrar recomputes the line and the total
 * before writing anything, so this figure is never what gets charged.
 */
function lineTotal(line: SaleCartLine): number {
  return Math.round(Number(line.unit_price) * 100) * line.quantity;
}

function formatCents(cents: number, locale: Locale): string {
  return formatCurrency(cents / 100, locale);
}

export function SaleForm() {
  const [state, formAction, pending] = useActionState(createSaleAction, initialSaleFormState);
  const [searching, startSearch] = useTransition();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SaleProductResult[]>([]);
  const [cart, setCart] = useState<SaleCartLine[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { t, locale } = useI18n();

  function runSearch() {
    startSearch(async () => {
      try {
        setResults(await searchSaleProductsAction(term));
        setSearchError(null);
      } catch {
        // The action already collapses a rejected session into an empty result;
        // reaching here means something unexpected, so it is reported instead of
        // silently looking like "no products matched".
        setSearchError(t("sales.searchCatalogFailed"));
        setResults([]);
      }
    });
  }

  function addProduct(product: SaleProductResult) {
    if (product.current_stock < 1) {
      return;
    }

    setCart((current) => {
      const existing = current.find((line) => line.product_id === product.id);

      if (existing) {
        // Never let the cart ask for more than the catalog has, so the 422 from
        // the stock check is the backstop rather than the first sign of trouble.
        return current.map((line) =>
          line.product_id === product.id
            ? { ...line, quantity: Math.min(line.quantity + 1, product.current_stock) }
            : line,
        );
      }

      return [
        ...current,
        {
          product_id: product.id,
          sku: product.sku,
          name: product.name,
          unit_price: product.price,
          quantity: 1,
          available: product.current_stock,
        },
      ];
    });
  }

  function changeQuantity(productId: number, quantity: number) {
    setCart((current) =>
      current.map((line) =>
        line.product_id === productId
          ? {
              ...line,
              // Clamped rather than rejected: the stepper cannot produce an
              // invalid quantity, and a hand-typed one snaps back to the limit.
              quantity: Math.min(Math.max(quantity, 1), line.available),
            }
          : line,
      ),
    );
  }

  function removeLine(productId: number) {
    setCart((current) => current.filter((line) => line.product_id !== productId));
  }

  const totalCents = cart.reduce((sum, line) => sum + lineTotal(line), 0);
  const hasItemsError = Boolean(state.errors.items);
  const emptyCart = cart.length === 0;

  return (
    <form action={formAction} noValidate className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t("sales.formTitle")}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {t("sales.formSubtitle")}
        </p>
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

        {hasItemsError ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.errors.items?.join(" ")}</span>
          </p>
        ) : null}

        {searchError ? (
          <p role="alert" className="text-xs text-red-600 dark:text-red-400">
            {searchError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {/* Not a <form>: this picker lives inside the sale form, and nesting one
            form inside another is invalid HTML the browser silently discards.
            role="search" keeps the landmark for assistive tech. */}
        <div role="search" className="space-y-2">
          <label htmlFor="sale-search" className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {t("sales.addProduct")}
          </label>

          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                aria-hidden="true"
              />
              <input
                id="sale-search"
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    // Otherwise Enter would submit the whole sale form with an
                    // empty cart instead of searching.
                    event.preventDefault();
                    runSearch();
                  }
                }}
                placeholder={t("sales.productSearchPlaceholder")}
                className="block w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-500 dark:focus:ring-zinc-500/20"
              />
            </div>

            <button
              type="button"
              onClick={runSearch}
              disabled={searching || term.trim() === ""}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {searching ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : t("common.search")}
            </button>
          </div>
        </div>

        {results.length > 0 ? (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {results.map((product) => {
              const soldOut = product.current_stock < 1;

              return (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {product.name}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {product.sku} &middot; {formatCurrency(product.price, locale)} &middot;{" "}
                      {soldOut
                        ? t("sales.outOfStock")
                        : t("sales.available", {
                            count: formatNumber(product.current_stock, locale),
                          })}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    disabled={soldOut}
                    aria-label={t("sales.addToSaleAria", { name: product.name })}
                    className="shrink-0 rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-zinc-400" aria-hidden="true" />
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {t("sales.linesWithCount", { count: cart.length })}
          </h3>
        </div>

        {emptyCart ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            {t("sales.emptyCart")}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {cart.map((line, index) => (
              <li key={line.product_id} className="px-3 py-2.5">
                {/* The cart is client state, so the values the Server Action
                    reads have to exist as real form fields. Indexed names keep
                    the line pairing intact. */}
                <input
                  type="hidden"
                  name={`items[${index}][product_id]`}
                  value={line.product_id}
                />
                <input
                  type="hidden"
                  name={`items[${index}][quantity]`}
                  value={line.quantity}
                />

                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {line.name}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {line.sku} &middot; {formatCurrency(line.unit_price, locale)}{" "}
                      {t("sales.unitPriceAbbreviation")}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => removeLine(line.product_id)}
                    aria-label={t("sales.removeFromSaleAria", { name: line.name })}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <Stepper
                      label={t("sales.decreaseAria", { name: line.name })}
                      onClick={() => changeQuantity(line.product_id, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      icon={<Minus className="size-3" aria-hidden="true" />}
                    />

                    <input
                      type="number"
                      min="1"
                      max={line.available}
                      step="1"
                      value={line.quantity}
                      onChange={(event) =>
                        changeQuantity(line.product_id, Number(event.target.value))
                      }
                      aria-label={t("sales.quantityAria", { name: line.name })}
                      className="w-16 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-center text-sm tabular-nums text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />

                    <Stepper
                      label={t("sales.increaseAria", { name: line.name })}
                      onClick={() => changeQuantity(line.product_id, line.quantity + 1)}
                      // Capped at the stock the catalog reported: the server would
                      // reject more anyway, and failing here would be clearer.
                      disabled={line.quantity >= line.available}
                      icon={<Plus className="size-3" aria-hidden="true" />}
                    />
                  </div>

                  <span className="tabular-nums text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatCents(lineTotal(line), locale)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-baseline justify-between rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800/50">
        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <Receipt className="size-4" aria-hidden="true" />
          {t("common.total")}
        </span>
        <span className="tabular-nums text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {formatCents(totalCents, locale)}
        </span>
      </div>

      <div>
        <label
          htmlFor="sale-payment-method"
          className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          {t("sales.paymentMethod")}
        </label>
        <div className="relative">
          <BadgeEuro
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <select
            id="sale-payment-method"
            name="payment_method"
            defaultValue="CASH"
            aria-invalid={Boolean(state.errors.payment_method)}
            aria-describedby={
              state.errors.payment_method ? "sale-payment-method-error" : undefined
            }
            className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-500/20 ${
              state.errors.payment_method
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10 dark:border-zinc-700"
            }`}
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`paymentMethods.${option.value}`)}
              </option>
            ))}
          </select>
        </div>
        {state.errors.payment_method ? (
          <p id="sale-payment-method-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {state.errors.payment_method[0]}
          </p>
        ) : null}
      </div>

      <FormField
        id="sale-customer"
        name="customer_name"
        label={t("sales.customer")}
        icon={User}
        autoComplete="name"
        placeholder={t("sales.customerPlaceholder")}
        hint={t("common.optional")}
        errors={state.errors.customer_name}
      />

      <button
        type="submit"
        disabled={pending || searching}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("sales.submitting")}
          </>
        ) : (
          <>
            <Receipt className="size-4" aria-hidden="true" />
            {t("sales.submit")}
          </>
        )}
      </button>
    </form>
  );
}

function Stepper({
  label,
  onClick,
  disabled,
  icon,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="rounded-lg border border-zinc-300 p-1.5 text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      {icon}
    </button>
  );
}