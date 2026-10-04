import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";

import { tenantDashboardPath } from "@/lib/auth/redirect-path";
import { readSession } from "@/lib/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu empresa para gestionar inventario y ventas.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await readSession();

  if (session) {
    redirect(tenantDashboardPath(session.tenantSlug));
  }

  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Package className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Inicia sesión
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Entra con el correo con el que te registraste o aceptaste tu invitación.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Solo accedes a los datos de las organizaciones donde eres miembro.
        </p>
      </div>
    </main>
  );
}