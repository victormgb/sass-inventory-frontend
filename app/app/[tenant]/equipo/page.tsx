import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock, UserPlus } from "lucide-react";

import { requireSession } from "@/lib/auth/require-session";
import { canInvite, grantableRoles, roleLabel } from "@/lib/roles";

import { InviteForm } from "./invite-form";
import { TeamPanel, TeamSkeleton } from "./team-panel";

export const metadata: Metadata = {
  title: "Equipo",
  description: "Invita a tu equipo y gestiona los roles de la organizacion.",
};

export default async function EquipoPage({ params }: PageProps<"/app/[tenant]/equipo">) {
  const { tenant } = await params;
  const session = await requireSession(tenant);

  const mayInvite = canInvite(session.role);
  const grantable = grantableRoles(session.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Equipo
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Quienes tienen acceso a {session.organization.name} y quien esta invitado.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Suspense fallback={<TeamSkeleton />}>
          <TeamPanel tenant={tenant} role={session.role} />
        </Suspense>

        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <UserPlus className="size-4" aria-hidden="true" />
            Invitar a alguien
          </h2>

          {mayInvite ? (
            <>
              <p className="mb-4 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Le enviaremos un enlace por correo. Puedes asignar{" "}
                {grantable.map(roleLabel).join(", ").toLowerCase()}.
              </p>
              <InviteForm role={session.role} />
            </>
          ) : (
            <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
              <Lock
                className="mt-0.5 size-4 shrink-0 text-zinc-500 dark:text-zinc-400"
                aria-hidden="true"
              />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Tu rol ({session.role ? roleLabel(session.role) : "sin rol"}) no puede
                invitar a nadie. Pide a un administrador que envie la invitacion.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
