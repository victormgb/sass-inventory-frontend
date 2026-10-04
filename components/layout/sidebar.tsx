"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Receipt, Settings, Users } from "lucide-react";

import { canManageOrganization } from "@/lib/roles";
import type { OrganizationRole, SessionOrganization } from "@/lib/types";

import { OrganizationLogo } from "./organization-logo";
import { TenantSwitcher } from "./tenant-switcher";

type NavItem = {
  segment: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Hidden when false. Mirrors the API's authorize(), which still refuses. */
  adminOnly?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { segment: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { segment: "productos", label: "Productos", icon: Package },
  { segment: "ventas", label: "Ventas", icon: Receipt },
  { segment: "equipo", label: "Equipo", icon: Users },
  // Only reachable by an owner. Hidden rather than disabled because a settings
  // entry that always says "ask an admin" is noise for everyone else.
  { segment: "configuracion", label: "Configuración", icon: Settings, adminOnly: true },
];

export function Sidebar({
  tenant,
  organizationName,
  logoUrl,
  organizations,
  role,
}: {
  tenant: string;
  organizationName: string;
  logoUrl: string | null;
  organizations: SessionOrganization[];
  role: OrganizationRole | null;
}) {
  const pathname = usePathname();
  const base = `/app/${tenant}`;
  const visible = NAV_ITEMS.filter((item) => !item.adminOnly || canManageOrganization(role));

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-zinc-200 bg-white lg:h-screen lg:w-64 lg:border-b-0 lg:border-r dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2.5 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <OrganizationLogo name={organizationName} logoUrl={logoUrl} />
        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {organizationName}
        </span>
      </div>

      <div className="border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <TenantSwitcher tenant={tenant} organizations={organizations} />
      </div>

      <nav aria-label="Navegación principal" className="flex-1 p-3">
        <ul className="flex gap-1 lg:flex-col">
          {visible.map(({ segment, label, icon: Icon }) => {
            const href = `${base}/${segment}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li key={segment}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}