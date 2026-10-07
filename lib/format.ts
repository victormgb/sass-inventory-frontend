import { INTL_LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * The currency never changes with the language.
 *
 * The amount is the same number of cents whichever language is selected, and the
 * tenant's currency is a property of the tenant, not of the reader. Rendering
 * "€1.234,56" to somebody whose books are kept in dollars would misstate every
 * total in the product. So the locale moves the separators and the symbol stays
 * USD.
 */
const CURRENCY = "USD";

/**
 * Formatters are cached per locale.
 *
 * Constructing an Intl formatter is the expensive part of formatting and these run
 * once per cell in a table, so a fresh one per call shows up in a long product
 * list. Keyed by locale because the locale is now part of the output.
 */
const currencyFormatters = new Map<Locale, Intl.NumberFormat>();
const numberFormatters = new Map<Locale, Intl.NumberFormat>();
const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();

function currencyFormatter(locale: Locale): Intl.NumberFormat {
  const cached = currencyFormatters.get(locale);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: "currency",
    currency: CURRENCY,
  });

  currencyFormatters.set(locale, formatter);

  return formatter;
}

function numberFormatter(locale: Locale): Intl.NumberFormat {
  const cached = numberFormatters.get(locale);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(INTL_LOCALES[locale]);
  numberFormatters.set(locale, formatter);

  return formatter;
}

/**
 * Pinned to UTC on purpose: these are rendered in Server Components, and a
 * server/client disagreement over the local timezone would surface as a hydration
 * mismatch the moment one of them moves into the browser.
 */
function dateFormatter(locale: Locale): Intl.DateTimeFormat {
  const cached = dateFormatters.get(locale);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  dateFormatters.set(locale, formatter);

  return formatter;
}

export function formatCurrency(value: string | number, locale: Locale = DEFAULT_LOCALE): string {
  return currencyFormatter(locale).format(Number(value));
}

export function formatNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  return numberFormatter(locale).format(value);
}

export function formatDate(
  value: string | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!value) {
    return "-";
  }

  return dateFormatter(locale).format(new Date(value));
}