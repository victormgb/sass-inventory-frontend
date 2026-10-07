"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_MAX_AGE, isLocale } from "./config";

/**
 * Stores the chosen language in a cookie.
 *
 * A Server Action and not a link to /?lang=en: the language does not live in the
 * URL in this app, so there is nothing to navigate to. Writing the cookie and
 * revalidating re-renders the current route in the new language, which is what
 * router.refresh() alone would not have done, since refreshing only re-reads the
 * data and does not change what the cookie says.
 *
 * The posted value is checked against the supported list rather than trusted. This
 * is not a security boundary -- the worst a forged value could do is pick a language
 * -- but an unvalidated cookie would reach getLocale() and fall through to the
 * default anyway, so failing loudly at the write is better than failing silently at
 * the read.
 *
 * httpOnly because nothing client-side needs to read it. The picker keeps the
 * current selection in React state, so a script that wanted to change the language
 * would go through this action like any other.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  const store = await cookies();

  store.set(LOCALE_COOKIE, isLocale(locale) ? locale : DEFAULT_LOCALE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: LOCALE_MAX_AGE,
  });

  revalidatePath("/", "layout");
}