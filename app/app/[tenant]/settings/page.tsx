import type { Metadata } from "next";
import { ImageUp, Lock, Settings, ShieldAlert } from "lucide-react";

import { requireSession } from "@/lib/auth/require-session";
import { getTranslate } from "@/lib/i18n/server";
import { canManageOrganization, roleLabel } from "@/lib/roles";

import {
  DeleteOrganizationForm,
  OrganizationForm,
  OrganizationLogoForm,
} from "./settings-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslate();

  return {
    title: t("nav.settings"),
    description: t("settings.description"),
  };
}

export default async function SettingsPage({ params }: PageProps<"/app/[tenant]/settings">) {
  const { tenant } = await params;
  const session = await requireSession(tenant);
  const t = await getTranslate();

  const mayManage = canManageOrganization(session.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {t("nav.settings")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {t("settings.subtitle", { organization: session.organization.name })}
        </p>
      </div>

      {mayManage ? (
        <>
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <Settings className="size-4" aria-hidden="true" />
              {t("settings.identity.title")}
            </h2>
            <p className="mb-5 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t("settings.identity.slugNoteStart")}{" "}
              <code className="font-mono">{session.organization.slug}</code>{" "}
              {t("settings.identity.slugNoteEnd")}
            </p>

            <OrganizationForm name={session.organization.name} />
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              <ImageUp className="size-4" aria-hidden="true" />
              {t("settings.logo.sectionTitle")}
            </h2>
            <p className="mb-5 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t("settings.logo.description")}
            </p>

            <OrganizationLogoForm
              name={session.organization.name}
              logoUrl={session.organization.logo_url}
            />
          </section>

          <section className="rounded-xl border border-red-200 bg-white p-5 shadow-sm dark:border-red-500/30 dark:bg-zinc-900">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
              <ShieldAlert className="size-4" aria-hidden="true" />
              {t("settings.danger.title")}
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
            {t("settings.roleBlocked", {
              role: session.role ? roleLabel(session.role, t) : t("roles.noRole"),
            })}
          </p>
        </div>
      )}
    </div>
  );
}