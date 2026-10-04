import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Loader2, Lock, PackagePlus } from "lucide-react";

import { ApiError, apiProduct } from "@/lib/api/laravel";
import { requireSession } from "@/lib/auth/require-session";
import { readSession } from "@/lib/auth/session";
import { canManageProducts, roleLabel } from "@/lib/roles";
import type { Product, ProductResponse } from "@/lib/types";

import { CatalogPanel, CatalogSkeleton } from "./catalog-panel";
import { ProductForm } from "./product-form";
import { parseProductQuery, productHref, returnQueryString } from "./query";

export const metadata: Metadata = {
  title: "Productos",
  description: "Catalogo de productos, precios y control de stock.",
};

export default async function ProductosPage({
  params,
  searchParams,
}: PageProps<"/app/[tenant]/productos">) {
  const [{ tenant }, rawSearchParams] = await Promise.all([params, searchParams]);

  const session = await requireSession(tenant);
  const query = parseProductQuery(rawSearchParams);
  const editable = canManageProducts(session.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Productos
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Catalogo de {session.organization.name}.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogPanel tenant={tenant} query={query} editable={editable} />
        </Suspense>

        {editable ? (
          <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Suspense fallback={<FormSkeleton />}>
              <ProductFormPanel tenant={tenant} query={query} />
            </Suspense>
          </aside>
        ) : (
          <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <Lock className="size-4" aria-hidden="true" />
              Solo lectura
            </h2>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Tu rol ({session.role ? roleLabel(session.role) : "sin rol"}) puede consultar el
              catalogo pero no anadir ni editar productos. Pide a un administrador o gerente que
              lo haga.
            </p>
            <Link
              href={productHref(tenant, query)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <PackagePlus className="size-3.5" aria-hidden="true" />
              Ver todo el catalogo
            </Link>
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Kept in its own boundary so the catalog paints without waiting for the edit
 * fetch, and so a hand-typed ?edit=999 resolves to the create form instead of a
 * broken editor.
 */
async function ProductFormPanel({
  tenant,
  query,
}: {
  tenant: string;
  query: ReturnType<typeof parseProductQuery>;
}) {
  const product = query.edit ? await loadEditedProduct(tenant, query.edit) : null;

  return (
    <ProductForm
      // Uncontrolled inputs: without a key, switching rows would leave the
      // previous product's values on screen.
      key={product?.id ?? "new"}
      tenant={tenant}
      product={product}
      returnQuery={returnQueryString(query)}
    />
  );
}

async function loadEditedProduct(tenant: string, id: number): Promise<Product | null> {
  const session = await readSession();

  if (!session) {
    return null;
  }

  try {
    const response = await apiProduct<ProductResponse>({ ...session, tenantSlug: tenant }, id);

    return response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function FormSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-4 w-28 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="space-y-1.5">
          <div className="h-3 w-16 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-400">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Cargando producto...
      </div>
    </div>
  );
}