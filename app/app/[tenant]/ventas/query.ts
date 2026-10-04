import type { PaymentMethod, SaleSort, SaleStatus, SortDirection } from "@/lib/types";

/**
 * Same allowlist as SaleController::SORTABLE. The API already falls back to
 * created_at for anything unknown, but parsing here keeps the rendered sort link
 * and the requested sort from ever disagreeing.
 */
const SORTABLE: readonly SaleSort[] = ["created_at", "total_amount", "order_number"];

const STATUSES: readonly SaleStatus[] = ["PENDING", "PAID", "CANCELLED", "REFUNDED"];

const PAYMENT_METHODS: readonly PaymentMethod[] = ["CASH", "CARD", "TRANSFER"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * searchParams is fully user-controlled, so nothing here is trusted: the page is
 * coerced to a positive integer and the sort key, status and payment method are
 * checked against allowlists. Out-of-range values fall back to defaults instead
 * of reaching the API or the URL builder.
 */
export function parseSaleQuery(
  params: Record<string, string | string[] | undefined>,
): {
  q?: string;
  status?: SaleStatus;
  payment_method?: PaymentMethod;
  sort: SaleSort;
  direction: SortDirection;
  page: number;
} {
  const q = (first(params.q) ?? "").trim();
  const status = first(params.status);
  const paymentMethod = first(params.payment_method);
  const sort = first(params.sort);
  const direction = first(params.direction);
  const page = Number(first(params.page) ?? "1");

  return {
    q: q === "" ? undefined : q.slice(0, 120),
    status: STATUSES.includes(status as SaleStatus) ? (status as SaleStatus) : undefined,
    payment_method: PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)
      ? (paymentMethod as PaymentMethod)
      : undefined,
    sort: SORTABLE.includes(sort as SaleSort) ? (sort as SaleSort) : "created_at",
    direction: direction === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export type ParsedSaleQuery = ReturnType<typeof parseSaleQuery>;

function toSearch(query: ParsedSaleQuery): string {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.payment_method) {
    params.set("payment_method", query.payment_method);
  }

  if (query.sort !== "created_at") {
    params.set("sort", query.sort);
  }

  if (query.direction === "asc") {
    params.set("direction", "asc");
  }

  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  return params.toString();
}

type HrefOverrides = Partial<Omit<ParsedSaleQuery, "page">> & { page?: number };

export function saleHref(
  tenant: string,
  query: ParsedSaleQuery,
  overrides: HrefOverrides = {},
): string {
  const search = toSearch({ ...query, ...overrides, page: overrides.page ?? 1 });

  return `/app/${tenant}/ventas${search === "" ? "" : `?${search}`}`;
}

/**
 * Filters are restored after a write; the page number is not. Registering a sale
 * from page 5 would otherwise land on a page 5 that no longer holds it.
 */
export function returnQueryString(query: ParsedSaleQuery): string {
  const search = toSearch({ ...query, page: 1 });

  return search === "" ? "" : `?${search}`;
}

export function sortDirectionFor(query: ParsedSaleQuery, column: SaleSort): SortDirection {
  return query.sort === column && query.direction === "asc" ? "desc" : "asc";
}