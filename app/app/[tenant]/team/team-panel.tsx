import { Clock, MailCheck } from "lucide-react";

import { apiInvitations, apiMembers } from "@/lib/api/laravel";
import { readSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { canInvite, roleLabel } from "@/lib/roles";
import { getLocale, getTranslate } from "@/lib/i18n/server";
import type { DictionaryKey, Translate } from "@/lib/i18n/types";
import type {
  Invitation,
  InvitationStatus,
  InvitationsResponse,
  MembersResponse,
  OrganizationRole,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";

import { RevokeButton } from "./revoke-button";

const STATUS_TONES: Record<InvitationStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  accepted: "success",
  revoked: "neutral",
  expired: "danger",
};

/**
 * The API sends the status in lowercase while the dictionary is keyed on the
 * uppercase enum, exactly like roles. Only the key is mapped here: the wording
 * itself is the shared `statuses.*` entry, not a local copy of it.
 */
const STATUS_KEYS: Record<InvitationStatus, DictionaryKey> = {
  pending: "statuses.PENDING",
  accepted: "statuses.ACCEPTED",
  revoked: "statuses.REVOKED",
  expired: "statuses.EXPIRED",
};

const DAY_MS = 86_400_000;

/**
 * Computed on the server on purpose: relative wording depends on the current
 * time, and a client re-render of the same string would hydrate against a
 * different answer.
 */
function expiryHint(invitation: Invitation, t: Translate): string | null {
  if (invitation.status !== "pending") {
    return null;
  }

  const days = Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / DAY_MS);

  if (days <= 0) {
    return t("team.pending.expiresToday");
  }

  if (days === 1) {
    return t("team.pending.expiresTomorrow");
  }

  return t("team.pending.expiresInDays", { days });
}

function initials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type TeamPanelProps = {
  tenant: string;
  role: OrganizationRole | null;
};

export async function TeamPanel({ tenant, role }: TeamPanelProps) {
  const session = await readSession();
  const t = await getTranslate();
  const locale = await getLocale();

  if (!session) {
    return null;
  }

  const scoped = { ...session, tenantSlug: tenant };
  const canManage = canInvite(role);

  // A CASHIER is refused by GET /invitations with a 403, so the request is
  // never issued rather than issued and swallowed.
  const [members, invitations] = await Promise.all([
    apiMembers<MembersResponse>(scoped),
    canManage ? apiInvitations<InvitationsResponse>(scoped) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="members-heading"
        className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2
            id="members-heading"
            className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {t("team.members.heading")}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {members.data.length === 1
              ? t("team.members.countSingular", { count: members.data.length })
              : t("team.members.countPlural", { count: members.data.length })}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              {t("team.members.caption")}
            </caption>
            <thead className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("team.members.columnPerson")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("team.members.columnRole")}
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  {t("team.members.columnJoined")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {members.data.map((member) => (
                <tr key={member.id}>
                  <th scope="row" className="px-5 py-3 font-normal">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {initials(member.user.full_name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                          {member.user.full_name}
                        </span>
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {member.user.email}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="px-5 py-3">
                    <Badge tone={member.role === "ADMIN" ? "success" : "neutral"}>
                      {roleLabel(member.role, t)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                    {formatDate(member.joined_at, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {invitations ? (
        <section
          aria-labelledby="invitations-heading"
          className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2
              id="invitations-heading"
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {t("team.pending.heading")}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {t("team.pending.description")}
            </p>
          </div>

          {invitations.data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="flex size-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                <MailCheck className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("team.pending.empty")}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {invitations.data.map((invitation) => {
                const hint = expiryHint(invitation, t);

                return (
                  <li
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {invitation.email}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>{roleLabel(invitation.role, t)}</span>
                        <span aria-hidden="true">&middot;</span>
                        <span>{t("team.pending.invitedBy", { name: invitation.invited_by.full_name })}</span>
                        {hint ? (
                          <>
                            <span aria-hidden="true">&middot;</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="size-3" aria-hidden="true" />
                              {hint}
                            </span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge tone={STATUS_TONES[invitation.status]}>
                        {t(STATUS_KEYS[invitation.status])}
                      </Badge>
                      {invitation.status === "pending" ? (
                        <RevokeButton invitationId={invitation.id} />
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

export function TeamSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-2.5 w-56 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
