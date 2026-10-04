"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from "lucide-react";

import { roleOptions } from "@/lib/roles";
import type { OrganizationRole } from "@/lib/types";

import { inviteAction } from "./actions";
import { initialInviteState } from "./state";

type InviteFormProps = {
  role: OrganizationRole | null;
};

export function InviteForm({ role }: InviteFormProps) {
  const [state, formAction, pending] = useActionState(inviteAction, initialInviteState);
  const formRef = useRef<HTMLFormElement>(null);
  const options = roleOptions(role);

  // Clear the email input once Laravel confirms the send, so a second invite
  // does not have to be typed from scratch.
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  const emailErrors = state.errors.email;
  const hasEmailError = Boolean(emailErrors?.length);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-4">
      <div aria-live="polite">
        {state.message ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </p>
        ) : null}

        {state.success ? (
          <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.success}</span>
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="invite-email"
          className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Correo electronico
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="persona@empresa.com"
            aria-invalid={hasEmailError}
            aria-describedby={hasEmailError ? "invite-email-error" : undefined}
            className={`block w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-500/20 ${
              hasEmailError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10 dark:border-zinc-700 dark:focus:border-zinc-500"
            }`}
          />
        </div>
        {hasEmailError ? (
          <p id="invite-email-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {emailErrors?.[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="invite-role"
          className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Rol
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue={options[0]?.value ?? ""}
          aria-describedby="invite-role-hint"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20"
        >
          {options.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p id="invite-role-hint" className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
          Solo puedes asignar los roles que tu permisos permiten.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending || options.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            Enviar invitacion
          </>
        )}
      </button>
    </form>
  );
}