import { getTranslate } from "@/lib/i18n/server";

export default async function VentasLoading() {
  const t = await getTranslate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("nav.sales")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("sales.loadingList")}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div
          aria-hidden="true"
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-4">
                <div className="h-3 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 flex-1 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="h-fit space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="h-4 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-24 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}