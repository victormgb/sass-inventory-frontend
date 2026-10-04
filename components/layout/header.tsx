import { LogOut } from "lucide-react";

import { roleLabel } from "@/lib/roles";
import { logoutAction } from "@/app/app/[tenant]/actions";

type HeaderProps = {
  userName: string;
  userEmail: string;
  role: string | null;
};

export function Header({ userName, userEmail, role }: HeaderProps) {
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {role ? roleLabel(role) : null}
      </p>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{userName}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{userEmail}</p>
        </div>
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          {initials}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  );
}
