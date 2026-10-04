import { redirect } from "next/navigation";

import { tenantDashboardPath } from "@/lib/auth/redirect-path";

/**
 * `/app/<tenant>` is a bare tenant segment, not a page of its own.
 *
 * It exists so any stale or hand-written link lands somewhere instead of 404ing.
 * Without it the redirect targets that resolve to a tenant are the only thing
 * keeping this path valid, and a miss here is a 404 rather than a wrong page.
 */
export default async function TenantIndexPage({ params }: PageProps<"/app/[tenant]">) {
  const { tenant } = await params;

  redirect(tenantDashboardPath(tenant));
}