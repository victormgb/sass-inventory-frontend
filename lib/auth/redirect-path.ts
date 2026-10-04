/**
 * Post-login destination handling.
 *
 * A `next` parameter is attacker-controlled, so it is never passed to redirect()
 * unchecked: only same-site paths inside the private area are accepted, and the
 * shape is pinned to exactly /app/<tenant>/<page>. Anything else (absolute URLs,
 * protocol-relative //evil.test, nested or extra segments) falls back to the
 * dashboard instead of bouncing the user off-site.
 */
const PRIVATE_PATH = /^\/app\/[a-z0-9-]+\/[a-z0-9-]+$/i;

export function safeRedirectPath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim();

  if (!candidate.startsWith("/app/") || candidate.includes("//")) {
    return null;
  }

  return PRIVATE_PATH.test(candidate) ? candidate : null;
}

/**
 * Landing path for a tenant.
 *
 * `/app/<tenant>` on its own is not a route: the segment only exists as a layout
 * parent, so redirecting there is a 404, not a redirect to the dashboard. Always
 * name the page.
 */
export function tenantDashboardPath(tenantSlug: string): string {
  return `/app/${tenantSlug}/dashboard`;
}