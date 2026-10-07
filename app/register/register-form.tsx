"use client";

import { useActionState } from "react";
import { AlertCircle, Building2, Loader2, Lock, Mail, User } from "lucide-react";

import { FormField } from "@/components/ui/form-field";
import { useI18n } from "@/lib/i18n/provider";

import { registerAction } from "./actions";
import { initialRegisterState } from "./state";

export function RegisterForm() {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(registerAction, initialRegisterState);

  return (
    <form action={formAction} noValidate className="space-y-5">
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
        id="organization_name"
        name="organization_name"
        label={t("register.organizationName")}
        autoComplete="organization"
        required
        icon={Building2}
        errors={state.errors.organization_name}
      />

      <FormField
        id="full_name"
        name="full_name"
        label={t("register.fullName")}
        autoComplete="name"
        required
        icon={User}
        errors={state.errors.full_name}
      />

      <FormField
        id="email"
        name="email"
        type="email"
        label={t("register.email")}
        autoComplete="email"
        required
        icon={Mail}
        errors={state.errors.email}
      />

      <FormField
        id="password"
        name="password"
        type="password"
        label={t("register.password")}
        autoComplete="new-password"
        required
        icon={Lock}
        errors={state.errors.password}
      />

      <FormField
        id="password_confirmation"
        name="password_confirmation"
        type="password"
        label={t("register.passwordConfirmation")}
        autoComplete="new-password"
        required
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
            {t("register.submitting")}
          </>
        ) : (
          t("register.submit")
        )}
      </button>
    </form>
  );
}