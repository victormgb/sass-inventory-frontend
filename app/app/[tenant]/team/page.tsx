import { Suspense } from "react";
import type { Metadata } from "next";
import { Lock, UserPlus } from "lucide-react";

import { requireSession } from "@/lib/auth/require-session";
import { canInvite, grantableRoles, roleLabel } from "@/lib/roles";
import { getTranslate } from "@/lib/i18n/server";

import { InviteForm } from "./invite-form";
import { TeamPanel, TeamSkeleton } from "./team-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslate();
  return {
    title: t("nav.team"),
    description: t("team.description"),
  };
}

export default async function TeamPage({ params }: PageProps<"/app/[tenant]/team">) {
  const { tenant } = await params;
  const session = await requireSession(tenant);

  const t = await getTranslate();
  const mayInvite = canInvite(session.role);
  const grantable = grantableRoles(session.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("nav.team")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("team.subtitle", { organization: session.organization.name })}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Suspense fallback={<TeamSkeleton />}>
          <TeamPanel tenant={tenant} role={session.role} />
        </Suspense>

        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <UserPlus className="size-4" aria-hidden="true" />
            {t("team.invite.heading")}
          </h2>

          {mayInvite ? (
            <>
              <p className="mb-4 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {t("team.invite.intro", {
                  roles: grantable.map((r) => roleLabel(r, t)).join(", ").toLowerCase(),
                })}
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
                {t("team.invite.noPermission", {
                  role: session.role ? roleLabel(session.role, t) : t("roles.noRole"),
                })}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
