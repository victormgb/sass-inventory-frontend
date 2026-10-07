import "server-only";

import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  negotiateLocale,
  type Locale,
} from "./config";
import { en } from "./dictionaries/en";
import { es } from "./dictionaries/es";
import { createTranslate, type Dictionary, type Translate } from "./types";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

/**
 * Resolves the locale for the current request.
 *
 * Order matters. The cookie is the user's explicit choice and always wins, even
 * over a browser header that has since changed: someone who picked English on a
 * shared machine should not have it silently revert because a second browser window
 * happens to declare a different preference.
 *
 * The Accept-Language fallback is what makes the *first* render correct. The proxy
 * does write the cookie, but a cookie set on the response is not visible to the
 * request that is already being rendered, so without this a first-time visitor with
 * an English browser would get one Spanish render before settling. Negotiating here
 * closes that flash and the cookie makes it free from the second request onwards.
 *
 * Falls back to the default rather than throwing, so a missing or hand-edited
 * cookie can never produce a 500.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const stored = store.get(LOCALE_COOKIE)?.value;

  if (isLocale(stored)) {
    return stored;
  }

  const requestHeaders = await headers();

  return negotiateLocale(requestHeaders.get("accept-language"));
}

export async function getDictionary(): Promise<Dictionary> {
  return DICTIONARIES[await getLocale()];
}

/**
 * Ready-to-use translator for Server Components, Server Actions and Route Handlers.
 *
 * There is no locale argument on purpose. Threading it through every call site is
 * exactly the prop drilling this avoids, and reading the request again is cheap.
 */
export async function getTranslate(): Promise<Translate> {
  return createTranslate(await getDictionary());
}

export { DEFAULT_LOCALE };