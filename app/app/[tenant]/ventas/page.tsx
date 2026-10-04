import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { requireSession } from "@/lib/auth/require-session";
import { canRegisterSales, roleLabel } from "@/lib/roles";

import { SaleForm } from "./sale-form";
import { SalesPanel, SalesSkeleton } from "./sales-panel";
import { parseSaleQuery } from "./query";

export const metadata: Metadata = {
  title: "Ventas",
  description: "Registro de ventas e historial de cobros.",
};

export default async function VentasPage({
  params,
  searchParams,
}: PageProps<"/app/[tenant]/ventas">) {
  const [{ tenant }, rawSearchParams] = await Promise.all([params, searchParams]);

  const session = await requireSession(tenant);
  const query = parseSaleQuery(rawSearchParams);
  const sellable = canRegisterSales(session.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ventas
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ventas de {session.organization.name}. Cada venta se cobra y descuenta stock al instante.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Suspense fallback={<SalesSkeleton />}>
          <SalesPanel tenant={tenant} query={query} />
        </Suspense>

        {sellable ? (
          <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Suspense fallback={<FormSkeleton />}>
              <SaleForm />
            </Suspense>
          </aside>
        ) : (
          <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <Lock className="size-4" aria-hidden="true" />
              Solo lectura
            </h2>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Tu rol ({session.role ? roleLabel(session.role) : "sin rol"}) puede consultar las
              ventas pero no registrar nuevas.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-4 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-24 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}