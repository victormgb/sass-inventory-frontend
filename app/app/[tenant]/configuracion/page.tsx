import type { Metadata } from "next";
import { ImageUp, Lock, Settings, ShieldAlert } from "lucide-react";

import { requireSession } from "@/lib/auth/require-session";
import { canManageOrganization, roleLabel } from "@/lib/roles";

import {
  DeleteOrganizationForm,
  OrganizationForm,
  OrganizationLogoForm,
} from "./settings-forms";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Nombre, logo y eliminación de la organización.",
};

export default async function ConfiguracionPage({ params }: PageProps<"/app/[tenant]/configuracion">) {
  const { tenant } = await params;
  const session = await requireSession(tenant);

  const mayManage = canManageOrganization(session.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ajustes de {session.organization.name}.
        </p>
      </div>

      {mayManage ? (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <Settings className="size-4" aria-hidden="true" />
              Identidad
            </h2>
            <p className="mb-5 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              El identificador <code className="font-mono">{session.organization.slug}</code>{" "}
              no cambia: forma parte de las URL y de la sesión de todos los
              miembros.
            </p>

            <OrganizationForm name={session.organization.name} />
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <ImageUp className="size-4" aria-hidden="true" />
              Logo
            </h2>
            <p className="mb-5 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Se guarda en el bucket de S3 y la URL se anota en la organización.
            </p>

            <OrganizationLogoForm
              name={session.organization.name}
              logoUrl={session.organization.logo_url}
            />
          </section>

          <section className="rounded-xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-500/30 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
              <ShieldAlert className="size-4" aria-hidden="true" />
              Zona peligrosa
            </h2>

            <div className="mt-4">
              <DeleteOrganizationForm slug={session.organization.slug} />
            </div>
          </section>
        </>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Lock
            className="mt-0.5 size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
            aria-hidden="true"
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tu rol ({session.role ? roleLabel(session.role) : "sin rol"}) no puede
            cambiar los ajustes de la organización. Pide a un administrador que los
            modifique.
          </p>
        </div>
      )}
    </div>
  );
}