"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";

import {
  createOrganizationAction,
  type CreateOrganizationState,
} from "@/lib/auth/organization-actions";
import { switchTenantAction, type SwitchTenantState } from "@/lib/auth/tenant-actions";
import { useI18n } from "@/lib/i18n/provider";
import { roleLabel } from "@/lib/roles";
import type { SwitcherOrganization } from "@/lib/types";

import { OrganizationLogo } from "./organization-logo";

const INITIAL_SWITCH: SwitchTenantState = {};
const INITIAL_CREATE: CreateOrganizationState = {};

/**
 * Tenant switcher: which organization the session is currently pointed at, plus
 * the way out to the others.
 *
 * It lives here rather than in the header because the sidebar already carries the
 * organization name, and a switcher you have to travel to is one nobody uses.
 */
export function TenantSwitcher({
  tenant,
  organizations,
}: {
  tenant: string;
  organizations: SwitcherOrganization[];
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const current = organizations.find((item) => item.slug === tenant);

  // The dropdown always opens, even with a single membership: "Nueva
  // organización" lives inside it, so a user with one organization and no way to
  // create a second is exactly the user who needs it open.
  const canSwitch = organizations.length > 1;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("shell.switchOrganization")}
        className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm transition hover:bg-zinc-50 disabled:cursor-default dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <OrganizationLogo
              name={current?.name ?? t("organizations.unnamed")}
              logoUrl={current?.logo_url ?? null}
            />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-zinc-900 dark:text-zinc-50">
            {current?.name ?? t("organizations.unnamed")}
          </span>
          {canSwitch ? (
            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
              {current ? roleLabel(current.role, t) : ""}
            </span>
          ) : null}
        </span>
        {canSwitch ? (
          <ChevronDown
            className={`size-4 shrink-0 text-zinc-400 transition ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        ) : (
          <Plus
            className="size-4 shrink-0 text-zinc-400"
            aria-hidden="true"
          />
        )}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <ul className="max-h-64 overflow-y-auto py-1">
            {organizations.map((organization) => {
              const isCurrent = organization.slug === tenant;

              return (
                <li key={organization.slug}>
                  <SwitchRow
                    organization={organization}
                    isCurrent={isCurrent}
                  />
                </li>
              );
            })}
          </ul>

          <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
            {creating ? (
              <CreateOrganizationForm
                onCancel={() => setCreating(false)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <Plus className="size-4" aria-hidden="true" />
                {t("organizations.new")}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * One membership, as a button rather than a link.
 *
 * A link to `/app/<slug>` cannot work: the session still points at the old tenant,
 * and proxy.ts rejects that mismatch, so it would bounce straight back. The switch
 * has to go through the server action that rewrites the cookie first.
 */
function SwitchRow({
  organization,
  isCurrent,
}: {
  organization: SwitcherOrganization;
  isCurrent: boolean;
}) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(switchTenantAction, INITIAL_SWITCH);

  if (isCurrent) {
    return (
      <div
        aria-current="true"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50"
      >
        <span className="min-w-0 flex-1 truncate">{organization.name}</span>
        <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
          {roleLabel(organization.role, t)}
        </span>
        <Check className="size-4 shrink-0" aria-hidden="true" />
      </div>
    );
  }

  // The action redirects on success, so reaching this render means it refused:
  // the slug was not in the membership list, or the session had expired.
  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="slug" value={organization.slug} />
        <SubmitRow label={organization.name} roleLabel={roleLabel(organization.role, t)} />
      </form>
      {state.error ? (
        <p role="alert" className="px-3 pb-2 text-xs text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

function SubmitRow({ label, roleLabel }: { label: string; roleLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{roleLabel}</span>
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : null}
    </button>
  );
}

function CreateOrganizationForm({ onCancel }: { onCancel: () => void }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(
    createOrganizationAction,
    INITIAL_CREATE,
  );

  return (
    <form action={formAction} className="space-y-2">
      <div>
        <label
          htmlFor="new-organization-name"
          className="sr-only"
        >
          {t("organizations.nameLabel")}
        </label>
        <input
          id="new-organization-name"
          name="name"
          autoFocus
          required
          maxLength={120}
          placeholder={t("organizations.namePlaceholder")}
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      {state.fieldErrors?.name ? (
        <p className="text-xs text-red-600 dark:text-red-400">
          {state.fieldErrors.name[0]}
        </p>
      ) : null}

      {state.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <CreateSubmitButton />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}

function CreateSubmitButton() {
  const { t } = useI18n();
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : null}
      {t("organizations.create")}
    </button>
  );
}