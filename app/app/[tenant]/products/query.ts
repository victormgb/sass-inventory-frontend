import type { ProductSort, SortDirection } from "@/lib/types";

/**
 * Same allowlist as ProductController::SORTABLE. The API already falls back to
 * "name" for anything unknown, but parsing here keeps the rendered sort link and
 * the requested sort from ever disagreeing.
 */
const SORTABLE: readonly ProductSort[] = [
  "name",
  "sku",
  "price",
  "cost_price",
  "current_stock",
  "created_at",
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * searchParams is fully user-controlled, so nothing here is trusted: the page is
 * coerced to a positive integer, the sort key is checked against the allowlist
 * and the direction is pinned to two literals. Out-of-range values fall back to
 * defaults instead of reaching the API or the URL builder.
 */
export function parseProductQuery(
  params: Record<string, string | string[] | undefined>,
): {
  q?: string;
  low_stock: boolean;
  sort: ProductSort;
  direction: SortDirection;
  page: number;
  edit?: number;
} {
  const q = (first(params.q) ?? "").trim();
  const sort = first(params.sort);
  const direction = first(params.direction);
  const lowStock = first(params.low_stock);
  const page = Number(first(params.page) ?? "1");
  const edit = Number(first(params.edit) ?? "0");

  return {
    q: q === "" ? undefined : q.slice(0, 120),
    low_stock: lowStock === "1" || lowStock === "true",
    sort: SORTABLE.includes(sort as ProductSort) ? (sort as ProductSort) : "name",
    direction: direction === "desc" ? "desc" : "asc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    edit: Number.isInteger(edit) && edit > 0 ? edit : undefined,
  };
}

export type ParsedProductQuery = ReturnType<typeof parseProductQuery>;

type MergedQuery = ParsedProductQuery & { page?: number | undefined };

/**
 * `edit` is dropped from every generated link: it drives the form, not the list,
 * and carrying it around would leave the form open after changing the search term
 * or the sort.
 */
function toSearch(merged: MergedQuery): string {
  const params = new URLSearchParams();

  if (merged.q) {
    params.set("q", merged.q);
  }

  if (merged.low_stock) {
    params.set("low_stock", "1");
  }

  if (merged.sort && merged.sort !== "name") {
    params.set("sort", merged.sort);
  }

  if (merged.direction === "desc") {
    params.set("direction", "desc");
  }

  if (merged.page && merged.page > 1) {
    params.set("page", String(merged.page));
  }

  return params.toString();
}

type HrefOverrides = Partial<Omit<ParsedProductQuery, "page">> & { page?: number };

export function productHref(
  tenant: string,
  query: ParsedProductQuery,
  overrides: HrefOverrides = {},
): string {
  // `edit` is pulled out of the merge on purpose: it only appears when a caller
  // asks for it explicitly, so following a sort or search link from the edit form
  // cannot leave the form open.
  const { edit, ...rest } = overrides;
  const merged = { ...query, ...rest, page: overrides.page ?? 1 };

  const params = new URLSearchParams(toSearch(merged));

  if (edit !== undefined && Number.isInteger(edit) && edit > 0) {
    params.set("edit", String(edit));
  }

  const search = params.toString();

  return `/app/${tenant}/products${search === "" ? "" : `?${search}`}`;
}

/**
 * Filters are restored after a write; the page number is not. Deleting the last
 * row of page 5 would otherwise land on an empty page 5.
 */
export function returnQueryString(query: ParsedProductQuery): string {
  const search = toSearch({ ...query, page: 1 });

  return search === "" ? "" : `?${search}`;
}

export function sortDirectionFor(query: ParsedProductQuery, column: ProductSort): SortDirection {
  return query.sort === column && query.direction === "asc" ? "desc" : "asc";
}