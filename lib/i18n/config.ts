/**
 * Locale support, in one place.
 *
 * Spanish is the default and has no prefix anywhere, because the language lives in
 * a cookie rather than the URL. That is a deliberate reversal of the usual Next.js
 * i18n setup (sub-path routing with app/[lang]) and it is what keeps the emailed
 * invitation links working: those are already out in the world as
 * /invitations/accept?token=..., and a locale prefix would 404 every one of them.
 */
export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * The user's own choice. Separate from the session cookies on purpose: clearing the
 * session must not silently change the language back, and the locale outlives both
 * the token and the active tenant.
 */
export const LOCALE_COOKIE = "erp_locale";

export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Endonyms, not English names. A language picker that says "Spanish" to someone who
 * only speaks Spanish is a small trap; each label is the language's own name for
 * itself, which is what the browser's own language list shows.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "English",
};

export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};

/**
 * Subset of Accept-Language tags mapped to a supported locale.
 *
 * Region subtags are dropped rather than matched exactly: a browser asking for
 * `en-GB` should land on `en`, not fall through to the default. Kept as an explicit
 * table because the mapping is a product decision, not something to re-derive from
 * the tag at runtime.
 */
const ACCEPT_LANGUAGE_MAP: Record<string, Locale> = {
  es: "es",
  en: "en",
};

/**
 * Picks a locale from an Accept-Language header.
 *
 * Quality values are honoured, which matters because a browser can list several
 * languages and the order it lists them in is not the order it wants them in.
 * Anything unsupported falls through to the default rather than to the first entry.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) {
    return DEFAULT_LOCALE;
  }

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...parameters] = part.trim().split(";");

      const quality = parameters
        .map((parameter) => parameter.trim())
        .find((parameter) => parameter.startsWith("q="));

      return {
        tag: tag.trim().toLowerCase(),
        quality: quality ? Number.parseFloat(quality.slice(2)) : 1,
      };
    })
    .filter((entry) => entry.tag !== "" && !Number.isNaN(entry.quality))
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];

    if (ACCEPT_LANGUAGE_MAP[base]) {
      return ACCEPT_LANGUAGE_MAP[base];
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * Intl locale tag per supported locale. Kept distinct from the URL/cookie key
 * because the two are not the same thing: "en" is our key, "en-US" is the tag
 * English speakers expect to see dates and separators rendered in.
 */
export const INTL_LOCALES: Record<Locale, string> = {
  es: "es-ES",
  en: "en-US",
};