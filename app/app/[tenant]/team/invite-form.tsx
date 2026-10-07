"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  Send,
} from "lucide-react";

import { useI18n } from "@/lib/i18n/provider";
import { roleOptions } from "@/lib/roles";
import type { OrganizationRole } from "@/lib/types";

import { inviteAction } from "./actions";
import { initialInviteState } from "./state";

type InviteFormProps = {
  role: OrganizationRole | null;
};

/**
 * Writes to the clipboard, reporting whether it actually landed.
 *
 * `navigator.clipboard` is undefined outside a secure context, so the fallback is
 * not belt and braces: on plain HTTP over a LAN address it is the only path that
 * works. `execCommand` is deprecated but still what every browser implements for
 * this, and it is never reached when the modern API succeeds.
 */
async function copyText(value: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(value);

      return true;
    } catch {
      // Permission denied or the document lost focus; fall through.
    }
  }

  try {
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(field);

    return copied;
  } catch {
    return false;
  }
}

export function InviteForm({ role }: InviteFormProps) {
  const { t } = useI18n();
  const [state, formAction, pending] = useActionState(inviteAction, initialInviteState);
  const formRef = useRef<HTMLFormElement>(null);
  const options = roleOptions(role, t);

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
          state.inviteUrl ? (
            <InviteLinkPanel url={state.inviteUrl} success={state.success} />
          ) : (
            <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{state.success}</span>
            </p>
          )
        ) : null}
      </div>

      <div>
        <label
          htmlFor="invite-email"
          className="mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          {t("team.invite.emailLabel")}
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
            placeholder={t("team.invite.emailPlaceholder")}
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
          {t("team.invite.roleLabel")}
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
          {t("team.invite.roleHint")}
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
            {t("team.invite.submitting")}
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            {t("team.invite.submit")}
          </>
        )}
      </button>
    </form>
  );
}

/**
 * The accept link of the invitation just sent, plus its copy button.
 *
 * Shown in a read-only field as well as copied because the clipboard is not
 * available everywhere the app is: outside a secure context `navigator.clipboard`
 * is undefined, and without a selectable field the button would degrade into a
 * control that silently does nothing. Focusing the field selects the whole URL, so
 * a failed copy leaves Ctrl+C working rather than leaving the user stuck.
 *
 * Nothing here is masked: this is the same URL the notification mail carries, and
 * hiding it from the person who just issued the invitation would only make the
 * manual fallback unusable.
 */
function InviteLinkPanel({ url, success }: { url: string; success: string }) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [seenUrl, setSeenUrl] = useState(url);
  const [feedback, setFeedback] = useState<{ copied: boolean; text: string } | null>(null);

  // A second invite reuses this component, and the previous confirmation would
  // otherwise still be on screen describing a link the user is no longer looking
  // at. Adjusted during render rather than in an effect, which would cost a second
  // cascading render to reach the same state and is exactly what the lint rule the
  // logo form already follows forbids.
  if (seenUrl !== url) {
    setSeenUrl(url);
    setFeedback(null);
  }

  async function handleCopy() {
    if (await copyText(url)) {
      setFeedback({ copied: true, text: t("team.invite.copied") });

      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
    setFeedback({ copied: false, text: t("team.invite.copyFailed") });
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
      <p className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{success}</span>
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <label htmlFor="invite-url" className="sr-only">
          {t("team.invite.linkLabel")}
        </label>
        <input
          ref={inputRef}
          id="invite-url"
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 truncate rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-700 outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500/40 dark:bg-zinc-950 dark:text-zinc-300"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:border-emerald-500/40 dark:bg-zinc-950 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
        >
          {feedback?.copied ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
          {t("team.invite.copyLink")}
        </button>
      </div>

      {feedback ? <p className="mt-1.5 text-xs">{feedback.text}</p> : null}
    </div>
  );
}