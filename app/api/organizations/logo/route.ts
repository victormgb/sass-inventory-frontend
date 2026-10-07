import { ApiError, apiForwardOrganizationLogo } from "@/lib/api/laravel";
import { clearSession, readSession } from "@/lib/auth/session";
import { getTranslate } from "@/lib/i18n/server";
import type { UpdateOrganizationResponse } from "@/lib/types";

/**
 * Logo upload, proxied to Laravel.
 *
 * This used to be a Server Action, and that was the wrong tool for it. A Server
 * Action caps its request body at 1MB by default, and the rejection reaches the
 * browser as a raw digest error naming neither the field nor the limit. Raising
 * `experimental.serverActions.bodySizeLimit` works around the symptom, but a route
 * handler has no such cap and no second serialization step for the file to get
 * lost in, so the bytes are forwarded as they arrive.
 *
 * The browser still never talks to Laravel: the session token is read from the
 * httpOnly cookie here and attached to the upstream request, so the Sanctum token
 * and the tenant header stay on the server.
 *
 * proxy.ts only matches /app/:path*, so this route is not covered by the cookie
 * existence check and validates the session itself.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await readSession();
  const t = await getTranslate();

  if (!session) {
    return Response.json({ message: t("errors.sessionMissing") }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return Response.json(
      { message: t("settings.logo.notMultipart") },
      { status: 422 },
    );
  }

  try {
    const data = await apiForwardOrganizationLogo<UpdateOrganizationResponse>(session, {
      body: await request.arrayBuffer(),
      contentType,
    });

    return Response.json(data);
  } catch (error) {
    if (error instanceof ApiError) {
      // The stored token stopped being accepted, which no amount of retrying will
      // fix. Clearing the cookies mirrors requireSession() so the next navigation
      // lands on the login form instead of bouncing off a dead session.
      if (error.status === 401 || error.status === 403) {
        await clearSession();
      }

      return Response.json(
        { message: error.message, errors: error.fieldErrors },
        { status: error.status },
      );
    }

    return Response.json(
      { message: t("settings.logo.uploadFailed") },
      { status: 500 },
    );
  }
}