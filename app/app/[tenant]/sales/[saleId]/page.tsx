import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeEuro, Receipt, User } from "lucide-react";

import { ApiError, apiSale } from "@/lib/api/laravel";
import { requireSession } from "@/lib/auth/require-session";
import { readSession } from "@/lib/auth/session";
import { getLocale, getTranslate } from "@/lib/i18n/server";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type { SaleResponse } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslate();
  return {
    title: t("sales.detailTitle"),
    description: t("sales.detailDescription"),
  };
}

export default async function SaleDetailPage({
  params,
}: PageProps<"/app/[tenant]/sales/[saleId]">) {
  const { tenant, saleId } = await params;

  await requireSession(tenant);

  const id = Number(saleId);
  const session = await readSession();

  if (!session || !Number.isInteger(id) || id <= 0) {
    notFound();
  }

  let sale;

  try {
    const response = await apiSale<SaleResponse>({ ...session, tenantSlug: tenant }, id);

    sale = response.data;
  } catch (error) {
    // Another organization's id lands here too: the API resolves the sale inside
    // the tenant scope and answers 404, so this cannot be used to probe for
    // foreign sales.
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  const t = await getTranslate();
  const locale = await getLocale();

  const lines = sale.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/app/${tenant}/sales`}
          className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-zinc-600 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("sales.backToList")}
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            <Receipt className="size-5" aria-hidden="true" />
            {sale.order_number}
          </h1>

          <Badge tone={sale.status === "PAID" ? "success" : "neutral"}>
            {t(`statuses.${sale.status}`)}
          </Badge>
        </div>

        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {formatDate(sale.created_at, locale)}
          {sale.sold_by
            ? ` &middot; ${t("sales.registeredBy", { name: sale.sold_by.full_name })}`
            : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Fact
          icon={BadgeEuro}
          label={t("sales.paymentMethod")}
          value={t(`paymentMethods.${sale.payment_method}`)}
        />
        <Fact
          icon={User}
          label={t("sales.customer")}
          value={sale.customer_name ?? t("sales.noCustomer")}
        />
      </div>

      <section
        aria-labelledby="sale-lines-heading"
        className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2
          id="sale-lines-heading"
          className="border-b border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
        >
          {t("sales.lines")}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              {t("sales.linesTableCaption")}
            </caption>
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">
                  {t("sales.product")}
                </th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">
                  {t("sales.quantity")}
                </th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">
                  {t("sales.price")}
                </th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">
                  {t("sales.subtotal")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {lines.map((line) => (
                <tr key={line.id}>
                  <th scope="row" className="px-5 py-3 text-left font-normal">
                    <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                      {line.product_name}
                    </span>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      {line.product_sku}
                      {/* The product can be deleted after the sale; the snapshot is
                          what the receipt has to keep showing. */}
                      {line.product_id === null ? ` ${t("sales.productDeleted")}` : ""}
                    </span>
                  </th>

                  <td className="px-5 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {formatNumber(line.quantity, locale)}
                  </td>

                  <td className="px-5 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {formatCurrency(line.unit_price, locale)}
                  </td>

                  <td className="px-5 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(line.subtotal, locale)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
              <tr>
                <th scope="row" colSpan={3} className="px-5 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-50">
                  {t("common.total")}
                </th>
                <td className="px-5 py-3 text-right text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatCurrency(sale.total_amount, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BadgeEuro;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}