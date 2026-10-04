import { Suspense } from "react";

import { KpiGrid } from "./kpi-grid";
import { KpiGridSkeleton } from "./kpi-grid-skeleton";

export default async function DashboardPage({ params }: PageProps<"/app/[tenant]/dashboard">) {
  const { tenant } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Resumen de inventario y ventas de hoy.
        </p>
      </div>

      <Suspense fallback={<KpiGridSkeleton />}>
        <KpiGrid tenant={tenant} />
      </Suspense>
    </div>
  );
}
