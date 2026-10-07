"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Locale } from "./config";
import { createTranslate, type Dictionary, type Translate } from "./types";

type I18nValue = {
  locale: Locale;
  dictionary: Dictionary;
  t: Translate;
};

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Makes the dictionary reachable from Client Components.
 *
 * React context is the only way a client component can read it: it cannot call the
 * cookie-reading server helper, and there is no URL segment to read a root param
 * from. The alternative, passing `t` down as a prop, touches every component in the
 * tree and every caller of those components for no benefit.
 *
 * The whole dictionary is handed over rather than just the translator. It is plain
 * data with no functions, so there is nothing executable to leak into the client
 * bundle, and having the locale available is what lets the language picker show the
 * current selection without a second round trip.
 */
export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const value: I18nValue = {
    locale,
    dictionary,
    t: createTranslate(dictionary),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used inside <I18nProvider>.");
  }

  return value;
}