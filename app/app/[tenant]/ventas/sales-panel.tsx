import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Search,
} from "lucide-react";
import Link from "next/link";

import { apiSales } from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  PAYMENT_METHOD_OPTIONS,
  type Sale,
  type SaleSort,
  type SalesResponse,
} from "@/lib/types";

import { saleHref, sortDirectionFor, type ParsedSaleQuery } from "./query";

const COLUMNS: { key: SaleSort; label: string; align?: "right" }[] = [
  { key: "order_number", label: "Numero" },
  { key: "created_at", label: "Fecha" },
  { key: "total_amount", label: "Total", align: "right" },
];

/** Only the labels the list itself needs; the API is authoritative on values. */
const STATUS_LABELS: Record<Sale["status"], string> = {
  PENDING: "Pendiente",
  PAID: "Pagada",
  CANCELLED: "Anulada",
  REFUNDED: "Reembolsada",
};

export async function SalesPanel({ tenant, query }: { tenant: string; query: ParsedSaleQuery }) {
  const session = await readSession();

  if (!session) {
    return null;
  }

  // The session is authoritative for the tenant: the URL segment already matched
  // it in requireSession(), and a query string must never be able to widen that.
  const response = await apiSales<SalesResponse>({ ...session, tenantSlug: tenant }, {
    q: query.q,
    status: query.status,
    payment_method: query.payment_method,
    sort: query.sort,
    direction: query.direction,
    per_page: 20,
    page: query.page,
  });

  const { data, meta } = response;
  const isFiltered = Boolean(query.q) || Boolean(query.status) || Boolean(query.payment_method);

  return (
    <section
      aria-labelledby="sales-heading"
      className="min-w-0 space-y-4 rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="sales-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Ventas registradas
          </h2>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {meta.total === 0
              ? "Sin ventas."
              : `${formatNumber(meta.total)} ${meta.total === 1 ? "venta" : "ventas"}${
                  isFiltered ? " con los filtros aplicados" : ""
                }.`}
          </p>
        </div>

        <form
          method="get"
          action={`/app/${tenant}/ventas`}
          className="flex flex-wrap items-center gap-2"
          role="search"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <label htmlFor="sales-search" className="sr-only">
              Buscar por numero de venta o cliente
            </label>
            <input
              id="sales-search"
              name="q"
              type="search"
              defaultValue={query.q ?? ""}
              placeholder="Buscar por numero de venta o cliente"
              className="block w-full rounded-lg border border-zinc-300 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20"
            />
          </div>

          <label htmlFor="sales-status" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="sales-status"
            name="status"
            defaultValue={query.status ?? ""}
            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_LABELS) as Sale["status"][]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <label htmlFor="sales-payment" className="sr-only">
            Filtrar por metodo de pago
          </label>
          <select
            id="sales-payment"
            name="payment_method"
            defaultValue={query.payment_method ?? ""}
            className="rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Todos los metodos</option>
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {query.sort !== "created_at" ? (
            <input type="hidden" name="sort" value={query.sort} />
          ) : null}
          {query.direction === "asc" ? (
            <input type="hidden" name="direction" value="asc" />
          ) : null}

          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Filtrar
          </button>

          {isFiltered ? (
            <Link
              href={`/app/${tenant}/ventas`}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Limpiar
            </Link>
          ) : null}
        </form>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <Receipt className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {isFiltered ? "Ninguna venta coincide" : "Todavia no hay ventas"}
          </p>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            {isFiltered
              ? "Prueba con otro texto o quita los filtros."
              : "Registra la primera venta con el formulario para ver el historial."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Ventas de la organizacion con numero, fecha, cliente y total
            </caption>
            <thead className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <tr>
                {COLUMNS.map((column) => {
                  const isSorted = query.sort === column.key;

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
                        href={saleHref(tenant, query, {
                          sort: column.key,
                          direction: sortDirectionFor(query, column.key),
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
                          <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
                        )}
                      </Link>
                    </th>
                  );
                })}

                <th scope="col" className="px-5 py-3 font-medium">
                  Cliente
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Metodo
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <th scope="row" className="px-5 py-3 text-left font-normal">
                    <Link
                      href={`/app/${tenant}/ventas/${sale.id}`}
                      className="rounded font-mono text-xs font-medium text-zinc-900 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-100"
                    >
                      {sale.order_number}
                    </Link>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      {sale.items_count}{" "}
                      {sale.items_count === 1 ? "linea" : "lineas"}
                    </span>
                  </th>

                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                    {formatDate(sale.created_at)}
                  </td>

                  <td className="px-5 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(sale.total_amount)}
                  </td>

                  <td className="max-w-[14rem] truncate px-5 py-3 text-zinc-600 dark:text-zinc-400">
                    {sale.customer_name ?? "Sin cliente"}
                  </td>

                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                    {sale.payment_method_label}
                  </td>

                  <td className="px-5 py-3">
                    <Badge tone={sale.status === "PAID" ? "success" : "neutral"}>
                      {sale.status_label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.last_page > 1 ? (
        <nav
          aria-label="Paginacion de ventas"
          className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3 text-sm dark:border-zinc-800"
        >
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Pagina {meta.current_page} de {meta.last_page}
          </p>

          <div className="flex items-center gap-2">
            <PagerLink
              href={saleHref(tenant, query, { page: query.page - 1 })}
              disabled={meta.current_page <= 1}
              label="Anterior"
              icon={<ChevronLeft className="size-4" aria-hidden="true" />}
            />
            <PagerLink
              href={saleHref(tenant, query, { page: query.page + 1 })}
              disabled={meta.current_page >= meta.last_page}
              label="Siguiente"
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

export function SalesSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-3 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="flex items-center gap-4">
            <div className="h-3 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-20 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 flex-1 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </section>
  );
}