"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Building2, Loader2 } from "lucide-react";

import { switchTenantAction, type SwitchTenantState } from "@/lib/auth/tenant-actions";
import { useI18n } from "@/lib/i18n/provider";
import { roleLabel } from "@/lib/roles";
import type { SessionOrganization } from "@/lib/types";

const initialSwitchState: SwitchTenantState = {};

/**
 * Second half of the login for accounts in more than one organization.
 *
 * It deliberately reuses switchTenantAction instead of minting another session:
 * the password has already been checked, and the same action the sidebar uses
 * means the slug is validated against the API's membership list rather than
 * against whatever the browser posted. No password is held in the client, so
 * picking an organization cannot replay a credential.
 */
export function OrganizationPicker({ organizations }: { organizations: SessionOrganization[] }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(switchTenantAction, initialSwitchState);

  return (
    <div className="space-y-5">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("login.pickOrganization")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("login.pickOrganizationHint")}
        </p>
      </div>

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      ) : null}

      <ul className="space-y-2">
        {organizations.map((organization) => (
          <li key={organization.slug}>
            <form action={formAction}>
              <input type="hidden" name="slug" value={organization.slug} />
              <OrganizationButton
                name={organization.name}
                // The role code, not the API's role_label. That label is a Spanish
                // string built by the backend and would stay Spanish in an English
                // session; the code is a wire value the dictionary can translate.
                role={organization.role}
              />
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrganizationButton({ name, role }: { name: string; role: string }) {
  const { t } = useI18n();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-left transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:focus-visible:outline-zinc-100"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Building2 className="size-4 text-zinc-500" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {name}
        </span>
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
          {roleLabel(role, t)}
        </span>
      </span>
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : null}
    </button>
  );
}