import { requireSession } from "@/lib/auth/require-session";
import type { SwitcherOrganization } from "@/lib/types";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default async function TenantLayout({ children, params }: LayoutProps<"/app/[tenant]">) {
  const { tenant } = await params;
  const session = await requireSession(tenant);

  // Picked field by field rather than passed whole: the API's role_label is Spanish
  // and would otherwise be serialized into the RSC payload of every page in here.
  const organizations: SwitcherOrganization[] = session.organizations.map(
    ({ id, name, slug, logo_url, role }) => ({ id, name, slug, logo_url, role }),
  );

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black lg:flex-row">
      <Sidebar
        tenant={tenant}
        organizationName={session.organization.name}
        logoUrl={session.organization.logo_url}
        organizations={organizations}
        role={session.role}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          userName={session.user.full_name}
          userEmail={session.user.email}
          role={session.role}
        />
        <main className="flex-1 p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
