import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";

import { tenantDashboardPath } from "@/lib/auth/redirect-path";
import { readSession } from "@/lib/auth/session";
import { getTranslate } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslate();

  return {
    title: t("register.title"),
    description: t("register.subtitle"),
  };
}

export default async function RegisterPage() {
  const session = await readSession();

  if (session) {
    redirect(tenantDashboardPath(session.tenantSlug));
  }

  const t = await getTranslate();

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
            {t("register.title")}
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {t("register.subtitle")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          {t("register.isolationNote")}
        </p>

        <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t("register.haveAccountPrefix")} {" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-100 dark:hover:text-white"
          >
            {t("register.haveAccountLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
