const CURRENCY = "EUR";
const LOCALE = "es-ES";

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatCurrency(value: string | number): string {
  return currencyFormatter.format(Number(value));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Pinned to UTC on purpose: these are rendered in Server Components, and a
 * server/client disagreement over the local timezone would surface as a
 * hydration mismatch the moment one of them moves into the browser.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  return dateFormatter.format(new Date(value));
}
