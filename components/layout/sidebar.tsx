"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Receipt, Settings, Users } from "lucide-react";

import { canManageOrganization } from "@/lib/roles";
import { useI18n } from "@/lib/i18n/provider";
import type { DictionaryKey } from "@/lib/i18n/types";
import type { OrganizationRole, SwitcherOrganization } from "@/lib/types";

import { OrganizationLogo } from "./organization-logo";
import { TenantSwitcher } from "./tenant-switcher";

type NavItem = {
  segment: string;
  labelKey: DictionaryKey;
  icon: typeof LayoutDashboard;
  /** Hidden when false. Mirrors the API's authorize(), which still refuses. */
  adminOnly?: boolean;
};

const NAV_ITEMS: readonly NavItem[] = [
  { segment: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { segment: "products", labelKey: "nav.products", icon: Package },
  { segment: "sales", labelKey: "nav.sales", icon: Receipt },
  { segment: "team", labelKey: "nav.team", icon: Users },
  // Only reachable by an owner. Hidden rather than disabled because a settings
  // entry that always says "ask an admin" is noise for everyone else.
  { segment: "settings", labelKey: "nav.settings", icon: Settings, adminOnly: true },
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
  organizations: SwitcherOrganization[];
  role: OrganizationRole | null;
}) {
  const { t } = useI18n();
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

      <nav aria-label={t("nav.main")} className="flex-1 p-3">
        <ul className="flex gap-1 lg:flex-col">
          {visible.map(({ segment, labelKey, icon: Icon }) => {
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
                  {t(labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}