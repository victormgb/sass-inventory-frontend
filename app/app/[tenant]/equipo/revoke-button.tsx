"use client";

import { useActionState } from "react";
import { Ban, Loader2 } from "lucide-react";

import { revokeAction } from "./actions";
import { initialRevokeState } from "./state";

export function RevokeButton({ invitationId }: { invitationId: number }) {
  const [state, formAction, pending] = useActionState(revokeAction, initialRevokeState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="invitation_id" value={invitationId} />

      <button
        type="submit"
        disabled={pending}
        aria-label="Revocar invitacion"
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Ban className="size-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Revocar</span>
      </button>

      <span role="status" aria-live="polite" className="text-xs">
        {state.error ? (
          <span className="text-red-600 dark:text-red-400">{state.error}</span>
        ) : state.message ? (
          <span className="text-emerald-600 dark:text-emerald-400">{state.message}</span>
        ) : null}
      </span>
    </form>
  );
}