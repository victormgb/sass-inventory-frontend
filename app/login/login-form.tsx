"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";

import { FormField } from "@/components/ui/form-field";

import { loginAction } from "./actions";
import { OrganizationPicker } from "./organization-picker";
import { initialLoginState } from "./state";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);

  // Password already verified: the form gives way to the organization picker
  // rather than asking for credentials again.
  if (state.organizations) {
    return <OrganizationPicker organizations={state.organizations} />;
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <FormField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        autoComplete="email"
        placeholder="tu@empresa.com"
        required
        icon={Mail}
        errors={state.errors.email}
      />

      <FormField
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        required
        icon={Lock}
        errors={state.errors.password}
      />

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Entrando...
          </>
        ) : (
          "Iniciar sesión"
        )}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href="/register"
          className="font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-100 dark:hover:text-white"
        >
          Crear una
        </Link>
      </p>
    </form>
  );
}