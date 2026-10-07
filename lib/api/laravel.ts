import "server-only";

import type { FieldErrors } from "@/lib/types";

const API_URL = process.env.LARAVEL_API_URL ?? "http://127.0.0.1:8000";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type LaravelErrorBody = {
  message?: string;
  errors?: FieldErrors;
};

async function toApiError(response: Response): Promise<ApiError> {
  let body: LaravelErrorBody = {};

  try {
    body = (await response.json()) as LaravelErrorBody;
  } catch {
    // Laravel returned a non-JSON body (proxy error page, empty 500, ...).
  }

  return new ApiError(
    response.status,
    body.message ?? `Laravel responded with ${response.status}`,
    body.errors ?? {},
  );
}

/**
 * Server-side client for the Laravel API.
 *
 * This runs only on the server: it reads the Sanctum token from an httpOnly
 * cookie and attaches the tenant header. The browser never holds either value,
 * which is why the frontend needs no CORS configuration and no client-side
 * interceptor.
 */
async function laravelFetch<T>(
  path: string,
  init: {
    token?: string;
    tenantSlug?: string;
    body?: unknown;
    method?: string;
  } = {},
): Promise<T> {
  const { token, tenantSlug, body, method = body ? "POST" : "GET" } = init;

  const headers = new Headers({ Accept: "application/json" });
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;

  // A multipart body has to keep its own Content-Type: the browser appends the
  // boundary there, and setting it by hand produces a boundary Laravel never sees,
  // so $_FILES comes back empty and every upload "fails" with a missing field.
  if (body !== undefined && !multipart) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (tenantSlug) {
    headers.set("X-Tenant-Slug", tenantSlug);
  }

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : multipart ? (body as FormData) : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiLogin<T>(payload: unknown): Promise<T> {
  return laravelFetch<T>("/auth/login", { body: payload });
}

export function apiRegister<T>(payload: unknown): Promise<T> {
  return laravelFetch<T>("/auth/register", { body: payload });
}

export function apiMe<T>(session: { token: string; tenantSlug: string }): Promise<T> {
  return laravelFetch<T>("/auth/me", session);
}

export function apiDashboardSummary<T>(session: {
  token: string;
  tenantSlug: string;
}): Promise<T> {
  return laravelFetch<T>("/dashboard/summary", session);
}

export function apiLogout<T>(session: { token: string; tenantSlug: string }): Promise<T> {
  return laravelFetch<T>("/auth/logout", { ...session, method: "POST" });
}

type TenantSession = { token: string; tenantSlug: string };

/**
 * Membership list. Sent with the token but deliberately without the tenant
 * header: the switcher needs to reach *other* organizations than the active one,
 * and IdentifyTenant would reject a header it cannot resolve or does not belong to.
 */
export function apiOrganizations<T>(session: { token: string }): Promise<T> {
  return laravelFetch<T>("/organizations", { token: session.token });
}

export function apiCreateOrganization<T>(
  session: { token: string },
  payload: unknown,
): Promise<T> {
  return laravelFetch<T>("/organizations", { token: session.token, body: payload });
}

/**
 * Renaming and the logo act on the active tenant, so they carry the tenant header
 * and send no identifier: the header is the only thing that decides which
 * organization is being changed.
 */
export function apiUpdateOrganization<T>(session: TenantSession, payload: unknown): Promise<T> {
  return laravelFetch<T>("/organizations", { ...session, method: "PATCH", body: payload });
}

/**
 * Logo upload. Takes FormData rather than JSON because the bytes have to travel as
 * the request body, and is a separate endpoint from update() for the same reason.
 */
export function apiUploadOrganizationLogo<T>(
  session: TenantSession,
  body: FormData,
): Promise<T> {
  return laravelFetch<T>("/organizations/logo", { ...session, method: "POST", body });
}

/**
 * Forwards an already-encoded multipart body untouched.
 *
 * The bytes and the Content-Type travel exactly as the browser produced them,
 * boundary included. Re-serialising a parsed FormData would work too, and this
 * endpoint has been reached that way, but the failure this endpoint is prone to is
 * specifically a multipart body whose boundary does not match the header that
 * describes it: PHP then sees no file at all and the upload fails with no obvious
 * cause. Not rebuilding the body is what removes that variable.
 *
 * ArrayBuffer rather than a stream because the API caps the file at 2MB, so the
 * whole body fits comfortably in memory and the non-streaming path avoids the
 * duplex/double-read problems a request stream runs into.
 */
export function apiForwardOrganizationLogo<T>(
  session: TenantSession,
  raw: { body: ArrayBuffer; contentType: string },
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });

  headers.set("Content-Type", raw.contentType);
  headers.set("Authorization", `Bearer ${session.token}`);
  headers.set("X-Tenant-Slug", session.tenantSlug);

  return laravelFetchWithHeaders<T>("/organizations/logo", {
    method: "POST",
    headers,
    body: raw.body,
  });
}

async function laravelFetchWithHeaders<T>(
  path: string,
  init: { headers: Headers; body: BodyInit; method: string },
): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: init.method,
    headers: init.headers,
    body: init.body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiRemoveOrganizationLogo<T>(session: TenantSession): Promise<T> {
  return laravelFetch<T>("/organizations/logo", { ...session, method: "DELETE" });
}

export function apiDeleteOrganization<T>(session: TenantSession): Promise<T> {
  return laravelFetch<T>("/organizations", { ...session, method: "DELETE" });
}

export function apiMembers<T>(session: TenantSession): Promise<T> {
  return laravelFetch<T>("/members", session);
}

export function apiInvitations<T>(session: TenantSession): Promise<T> {
  return laravelFetch<T>("/invitations", session);
}

export function apiCreateInvitation<T>(session: TenantSession, payload: unknown): Promise<T> {
  return laravelFetch<T>("/invitations", { ...session, body: payload });
}

export function apiRevokeInvitation<T>(session: TenantSession, invitationId: number): Promise<T> {
  return laravelFetch<T>(`/invitations/${invitationId}`, { ...session, method: "DELETE" });
}

/**
 * Public endpoints: the invitee has no session yet, and the token is the only
 * credential. No Authorization header is attached on purpose.
 */
export function apiInvitationPreview<T>(token: string): Promise<T> {
  return laravelFetch<T>(`/invitations/accept?token=${encodeURIComponent(token)}`);
}

export function apiAcceptInvitation<T>(payload: unknown): Promise<T> {
  return laravelFetch<T>("/invitations/accept", { body: payload });
}

function toSearchParams(query: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const search = params.toString();

  return search === "" ? "" : `?${search}`;
}

export function apiProducts<T>(
  session: TenantSession,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  return laravelFetch<T>(`/products${toSearchParams(query)}`, session);
}

export function apiProduct<T>(session: TenantSession, id: number): Promise<T> {
  return laravelFetch<T>(`/products/${id}`, session);
}

export function apiCreateProduct<T>(session: TenantSession, payload: unknown): Promise<T> {
  return laravelFetch<T>("/products", { ...session, body: payload });
}

export function apiUpdateProduct<T>(
  session: TenantSession,
  id: number,
  payload: unknown,
): Promise<T> {
  return laravelFetch<T>(`/products/${id}`, { ...session, body: payload, method: "PUT" });
}

export function apiDeleteProduct<T>(session: TenantSession, id: number): Promise<T> {
  return laravelFetch<T>(`/products/${id}`, { ...session, method: "DELETE" });
}

export function apiSales<T>(
  session: TenantSession,
  query: Record<string, string | number | boolean | undefined> = {},
): Promise<T> {
  return laravelFetch<T>(`/sales${toSearchParams(query)}`, session);
}

export function apiSale<T>(session: TenantSession, id: number): Promise<T> {
  return laravelFetch<T>(`/sales/${id}`, session);
}

export function apiCreateSale<T>(session: TenantSession, payload: unknown): Promise<T> {
  return laravelFetch<T>("/sales", { ...session, body: payload });
}
