import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Building2, LogIn, Package } from "lucide-react";

import { ApiError, apiInvitationPreview } from "@/lib/api/laravel";
import { formatDate } from "@/lib/format";
import type { InvitationPreview, InvitationPreviewResponse } from "@/lib/types";

import { AcceptForm } from "./accept-form";

export const metadata: Metadata = {
  title: "Aceptar invitacion",
  description: "Crea tu cuenta y accede al equipo que te invito.",
};

/**
 * The preview is a credential-free lookup: anyone holding the link sees what it
 * is for. It is fetched on the server so the page can render a decision (accept
 * vs. blocked) before any form is shown.
 */
type Preview =
  | { status: "ready"; data: InvitationPreview }
  | { status: "expired"; message: string }
  | { status: "invalid"; message: string };

async function loadPreview(token: string): Promise<Preview> {
  if (!token) {
    return { status: "invalid", message: "El enlace de invitacion no es valido." };
  }

  try {
    const response = await apiInvitationPreview<InvitationPreviewResponse>(token);

    return { status: "ready", data: response.data };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 410) {
        return {
          status: "expired",
          message:
            error.message ||
            "Esta invitacion ya no es valida. Pide una nueva a quien te invito.",
        };
      }

      if (error.status === 404) {
        return { status: "invalid", message: "El enlace de invitacion no es valido." };
      }
    }

    throw error;
  }
}

function Problem({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md text-center">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      </div>
    </main>
  );
}

export default async function AcceptInvitationPage({
  searchParams,
}: PageProps<"/invitations/accept">) {
  const { token } = await searchParams;
  const preview = await loadPreview(typeof token === "string" ? token : "");

  if (preview.status !== "ready") {
    return (
      <Problem
        title={preview.status === "expired" ? "Invitacion caducada" : "Enlace no valido"}
        message={preview.message}
      />
    );
  }

  const { organization, role_label, email, user_exists } = preview.data;

  if (user_exists) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <div className="w-full max-w-md text-center">
          <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <LogIn className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Ya tienes una cuenta
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {email} ya esta registrado. Inicia sesion para entrar en {organization.name}.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/app/${organization.slug}/dashboard`)}`}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Iniciar sesion
          </Link>
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
            Si no recuerdas tu contrasena,{" "}
            <Link href="/login" className="underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200">
              pide ayuda a quien te invito
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Package className="size-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Te han invitado
          </h1>
        </div>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {organization.name}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Entraras como {role_label.toLowerCase()}. Este enlace caduca el{" "}
              {formatDate(preview.data.expires_at)}.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Crea tu cuenta
          </h2>
          <AcceptForm token={String(token)} email={email} />
        </div>
      </div>
    </main>
  );
}
