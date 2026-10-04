"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2, Lock, Mail, User } from "lucide-react";

import { acceptInvitationAction } from "./actions";
import { initialAcceptState } from "./state";

const inputClasses =
  "block w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20";

const iconClasses =
  "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400";

const errorClasses = "border-red-500 focus:border-red-500 focus:ring-red-500/20";

type FieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  icon: typeof User;
  errors?: string[];
};

function Field({ id, name, label, type = "text", autoComplete, icon: Icon, errors }: FieldProps) {
  const hasError = Boolean(errors?.length);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </label>
      <div className="relative">
        <Icon className={iconClasses} aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          className={`${inputClasses} ${hasError ? errorClasses : ""}`}
        />
      </div>
      {hasError ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          {errors?.[0]}
        </p>
      ) : null}
    </div>
  );
}

export function AcceptForm({ token, email }: { token: string; email: string }) {
  const [state, formAction, pending] = useActionState(
    acceptInvitationAction,
    initialAcceptState,
  );

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.message ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      ) : null}

      <Field
        id="full_name"
        name="full_name"
        label="Tu nombre"
        autoComplete="name"
        icon={User}
        errors={state.errors.full_name}
      />

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Correo electronico
        </label>
        <div className="relative">
          <Mail className={iconClasses} aria-hidden="true" />
          <input
            id="email"
            name="email_display"
            type="email"
            value={email}
            readOnly
            aria-describedby="email-hint"
            className={`${inputClasses} cursor-not-allowed bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400`}
          />
        </div>
        <p id="email-hint" className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
          La invitacion es para esta direccion, no se puede cambiar.
        </p>
      </div>

      <Field
        id="password"
        name="password"
        type="password"
        label="Contrasena"
        autoComplete="new-password"
        icon={Lock}
        errors={state.errors.password}
      />

      <Field
        id="password_confirmation"
        name="password_confirmation"
        type="password"
        label="Repite la contrasena"
        autoComplete="new-password"
        icon={Lock}
        errors={state.errors.password_confirmation}
      />

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Creando tu cuenta...
          </>
        ) : (
          "Aceptar invitacion"
        )}
      </button>
    </form>
  );
}
