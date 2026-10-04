"use server";

import { redirect } from "next/navigation";

import { apiLogout } from "@/lib/api/laravel";
import { clearSession, readSession } from "@/lib/auth/session";

export async function logoutAction(): Promise<void> {
  const session = await readSession();

  if (session) {
    try {
      await apiLogout(session);
    } catch {
      // The token may already be revoked; the local session is cleared either way.
    }
  }

  await clearSession();
  redirect("/register");
}
