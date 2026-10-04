import { AlertTriangle, Banknote, Package, ShoppingCart } from "lucide-react";

import { apiDashboardSummary } from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DashboardSummary } from "@/lib/types";
import { KpiCard } from "@/components/ui/kpi-card";

export async function KpiGrid({ tenant }: { tenant: string }) {
  const session = await readSession();

  if (!session) {
    return null;
  }

  const summary = await apiDashboardSummary<DashboardSummary>({ ...session, tenantSlug: tenant });
  const { metrics } = summary;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Productos"
        value={formatNumber(metrics.total_products)}
        hint="En catalogo"
        icon={Package}
      />
      <KpiCard
        label="Ventas de hoy"
        value={formatCurrency(metrics.revenue_today)}
        hint={`${formatNumber(metrics.orders_today)} pedidos pagados`}
        icon={ShoppingCart}
      />
      <KpiCard
        label="Alertas de stock"
        value={formatNumber(metrics.low_stock_products)}
        hint="Productos por reponer"
        icon={AlertTriangle}
        tone={metrics.low_stock_products > 0 ? "warning" : "default"}
      />
      <KpiCard
        label="Ingresos de hoy"
        value={formatCurrency(metrics.revenue_today)}
        hint={summary.organization.name}
        icon={Banknote}
      />
    </div>
  );
}
