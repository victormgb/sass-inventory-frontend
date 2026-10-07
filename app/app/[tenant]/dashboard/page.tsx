import { Suspense } from "react";

import { getTranslate } from "@/lib/i18n/server";

import { KpiGrid } from "./kpi-grid";
import { KpiGridSkeleton } from "./kpi-grid-skeleton";

export default async function DashboardPage({ params }: PageProps<"/app/[tenant]/dashboard">) {
  const { tenant } = await params;
  const t = await getTranslate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <Suspense fallback={<KpiGridSkeleton label={t("dashboard.loadingSummary")} />}>
        <KpiGrid tenant={tenant} />
      </Suspense>
    </div>
  );
}
