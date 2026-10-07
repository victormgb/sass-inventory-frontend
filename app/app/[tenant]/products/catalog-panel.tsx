import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
} from "lucide-react";
import Link from "next/link";

import { apiProducts } from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { getLocale, getTranslate } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/types";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Product, ProductSort, ProductsResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

import {
  productHref,
  returnQueryString,
  sortDirectionFor,
  type ParsedProductQuery,
} from "./query";
import { ProductRowActions } from "./row-actions";

type CatalogPanelProps = {
  tenant: string;
  query: ParsedProductQuery;
  editable: boolean;
};

export async function CatalogPanel({ tenant, query, editable }: CatalogPanelProps) {
  const session = await readSession();

  if (!session) {
    return null;
  }

  const t = await getTranslate();
  const locale = await getLocale();

  const COLUMNS: { key: ProductSort; label: string; align?: "right" }[] = [
    { key: "sku", label: t("products.columnSku") },
    { key: "name", label: t("products.columnName") },
    { key: "price", label: t("products.columnPrice"), align: "right" },
    { key: "cost_price", label: t("products.columnCost"), align: "right" },
    { key: "current_stock", label: t("products.columnStock"), align: "right" },
  ];

  // The session is authoritative for the tenant: the URL segment already matched
  // it in requireSession(), and a query string must never be able to widen that.
  const scoped = { ...session, tenantSlug: tenant };

  const response = await apiProducts<ProductsResponse>(scoped, {
    q: query.q,
    low_stock: query.low_stock ? "1" : undefined,
    sort: query.sort,
    direction: query.direction,
    per_page: 20,
    page: query.page,
  });

  const { data, meta } = response;
  const returnQuery = returnQueryString(query);
  const isFiltered = Boolean(query.q) || query.low_stock;

  let summary: string;
  if (meta.total === 0) {
    summary = t("products.summaryEmpty");
  } else if (meta.total === 1) {
    summary = t("products.summaryOne", { count: formatNumber(meta.total, locale) });
  } else {
    summary = t("products.summaryMany", { count: formatNumber(meta.total, locale) });
  }
  if (isFiltered && meta.total > 0) {
    summary += t("products.summaryFilteredSuffix");
  }

  return (
    <section
      aria-labelledby="catalog-heading"
      className="min-w-0 space-y-4 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2
              id="catalog-heading"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {t("products.catalogTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {summary}
            </p>
          </div>

          <Link
            href={productHref(tenant, query, { low_stock: !query.low_stock, page: 1 })}
            aria-pressed={query.low_stock}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
              query.low_stock
                ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {query.low_stock ? t("products.lowStockFilterClear") : t("products.lowStockFilterOnly")}
          </Link>
        </div>

        <form
          method="get"
          action={`/app/${tenant}/products`}
          className="flex flex-wrap items-center gap-2"
          role="search"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <label htmlFor="catalog-search" className="sr-only">
              {t("products.searchPlaceholder")}
            </label>
            <input
              id="catalog-search"
              name="q"
              type="search"
              defaultValue={query.q ?? ""}
              placeholder={t("products.searchPlaceholder")}
              className="block w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-500 dark:focus:ring-zinc-500/20"
            />
          </div>

          {query.low_stock ? <input type="hidden" name="low_stock" value="1" /> : null}
          {query.sort !== "name" ? (
            <input type="hidden" name="sort" value={query.sort} />
          ) : null}
          {query.direction === "desc" ? (
            <input type="hidden" name="direction" value="desc" />
          ) : null}

          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {t("common.search")}
          </button>

          {isFiltered ? (
            <Link
              href={`/app/${tenant}/products`}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {t("common.clearFilters")}
            </Link>
          ) : null}
        </form>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Package className="size-5" aria-hidden="true" />
          </span>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {isFiltered ? t("products.emptyFilteredTitle") : t("products.emptyTitle")}
            </p>
            <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              {isFiltered ? t("products.emptyFilteredBody") : t("products.emptyBody")}
            </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              {t("products.tableCaption")}
            </caption>
            <thead className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <tr>
                {COLUMNS.map((column) => {
                  const isSorted = query.sort === column.key;
                  const next = sortDirectionFor(query, column.key);

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      aria-sort={
                        isSorted
                          ? query.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className={`px-5 py-3 font-medium ${column.align === "right" ? "text-right" : ""}`}
                    >
                      <Link
                        href={productHref(tenant, query, {
                          sort: column.key,
                          direction: next,
                          page: 1,
                        })}
                        className="inline-flex items-center gap-1 rounded hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:text-zinc-100"
                      >
                        {column.label}
                        {isSorted ? (
                          query.direction === "asc" ? (
                            <ArrowUp className="size-3" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown
                            className="size-3 opacity-40"
                            aria-hidden="true"
                          />
                        )}
                      </Link>
                    </th>
                  );
                })}

                {editable ? (
                    <th scope="col" className="px-5 py-3 text-right font-medium">
                      {t("common.actions")}
                    </th>
                ) : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.map((product) => (
                <Row
                  key={product.id}
                   product={product}
                   tenant={tenant}
                   query={query}
                   editable={editable}
                   returnQuery={returnQuery}
                   t={t}
                   locale={locale}
                 />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.last_page > 1 ? (
        <nav
          aria-label={t("products.paginationLabel")}
          className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3 text-sm dark:border-zinc-800"
        >
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("common.pageOf", { current: meta.current_page, total: meta.last_page })}
          </p>

          <div className="flex items-center gap-2">
            <PagerLink
              href={productHref(tenant, query, { page: query.page - 1 })}
              disabled={meta.current_page <= 1}
              label={t("common.previousPage")}
              icon={<ChevronLeft className="size-4" aria-hidden="true" />}
            />
            <PagerLink
              href={productHref(tenant, query, { page: query.page + 1 })}
              disabled={meta.current_page >= meta.last_page}
              label={t("common.nextPage")}
              icon={<ChevronRight className="size-4" aria-hidden="true" />}
            />
          </div>
        </nav>
      ) : null}
    </section>
  );
}

function PagerLink({
  href,
  disabled,
  label,
  icon,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 opacity-60 dark:text-zinc-600"
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-100"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

function Row({
  product,
  tenant,
  query,
  editable,
  returnQuery,
  t,
  locale,
}: {
  product: Product;
  tenant: string;
  query: ParsedProductQuery;
  editable: boolean;
  returnQuery: string;
  t: Translate;
  locale: Locale;
}) {
  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
      <th scope="row" className="px-5 py-3 text-left font-mono text-xs font-normal text-zinc-500 dark:text-zinc-400">
        {product.sku}
      </th>

      <td className="px-5 py-3">
        <span className="block font-medium text-zinc-900 dark:text-zinc-100">
          {product.name}
        </span>
        {product.description ? (
          <span className="mt-0.5 block max-w-md truncate text-xs text-zinc-500 dark:text-zinc-400">
            {product.description}
          </span>
        ) : null}
      </td>

      <td className="px-5 py-3 text-right tabular-nums text-zinc-900 dark:text-zinc-100">
        {formatCurrency(product.price, locale)}
      </td>

      <td className="px-5 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
        {formatCurrency(product.cost_price, locale)}
      </td>

      <td className="px-5 py-3 text-right">
        <span className="flex items-center justify-end gap-2">
          <span className="tabular-nums text-zinc-900 dark:text-zinc-100">
            {formatNumber(product.current_stock, locale)}
          </span>
          {product.is_low_on_stock ? (
            <Badge tone="warning">
              <span title={t("products.lowStockBadgeTitle", { count: product.min_stock_alert })}>
                {t("products.lowStockBadge")}
              </span>
            </Badge>
          ) : null}
        </span>
      </td>

      {editable ? (
        <td className="px-5 py-3 text-right">
          <ProductRowActions
            productId={product.id}
            sku={product.sku}
            name={product.name}
            returnQuery={returnQuery}
            editHref={productHref(tenant, query, { page: query.page, edit: product.id })}
          />
        </td>
      ) : null}
    </tr>
  );
}

export function CatalogSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="h-8 w-28 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-4">
            <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 flex-1 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-12 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </section>
  );
}