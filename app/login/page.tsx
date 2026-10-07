import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";

import { tenantDashboardPath } from "@/lib/auth/redirect-path";
import { readSession } from "@/lib/auth/session";
import { getTranslate } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

import { LoginForm } from "./login-form";

/**
 * generateMetadata rather than a static export: the title and description are
 * translated copy, so they cannot be a module constant.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslate();

  return {
    title: t("login.title"),
    description: t("login.subtitle"),
  };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await readSession();

  if (session) {
    redirect(tenantDashboardPath(session.tenantSlug));
  }

  const t = await getTranslate();
  const { next } = await searchParams;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Package className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("login.title")}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {t("login.subtitle")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          {t("login.membershipNote")}
        </p>
      </div>
    </main>
  );
}