import { AlertTriangle, Banknote, Package, ShoppingCart } from "lucide-react";

import { apiDashboardSummary } from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getLocale, getTranslate } from "@/lib/i18n/server";
import type { DashboardSummary } from "@/lib/types";
import { KpiCard } from "@/components/ui/kpi-card";

export async function KpiGrid({ tenant }: { tenant: string }) {
  const session = await readSession();

  if (!session) {
    return null;
  }

  const summary = await apiDashboardSummary<DashboardSummary>({ ...session, tenantSlug: tenant });
  const locale = await getLocale();
  const t = await getTranslate();
  const { metrics } = summary;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={t("dashboard.totalProducts")}
        value={formatNumber(metrics.total_products, locale)}
        hint={t("dashboard.inCatalog")}
        icon={Package}
      />
      <KpiCard
        label={t("dashboard.salesToday")}
        value={formatCurrency(metrics.revenue_today, locale)}
        hint={t("dashboard.paidOrders", { count: formatNumber(metrics.orders_today, locale) })}
        icon={ShoppingCart}
      />
      <KpiCard
        label={t("dashboard.stockAlerts")}
        value={formatNumber(metrics.low_stock_products, locale)}
        hint={t("dashboard.toRestock")}
        icon={AlertTriangle}
        tone={metrics.low_stock_products > 0 ? "warning" : "default"}
      />
      <KpiCard
        label={t("dashboard.revenueToday")}
        value={formatCurrency(metrics.revenue_today, locale)}
        hint={summary.organization.name}
        icon={Banknote}
      />
    </div>
  );
}
