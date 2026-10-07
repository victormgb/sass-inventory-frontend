"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";

import { setLocaleAction } from "@/lib/i18n/actions";
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  type Locale,
} from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Language picker.
 *
 * A native <select> rather than a custom listbox on purpose: it gets keyboard
 * support, screen reader announcements and the platform picker on mobile for free,
 * and all this needs to do is show two options. Building a custom dropdown here
 * would mean reimplementing all of that badly.
 *
 * A select posts on change, which is what makes this a form: onChange starting the
 * transition means there is no submit button anywhere near it, and the whole thing
 * degrades to a working form if JavaScript never runs.
 */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();

  function change(next: string) {
    startTransition(async () => {
      await setLocaleAction(next);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Languages
        className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
        aria-hidden="true"
      />
      <label htmlFor="language-switcher" className="sr-only">
        {t("shell.language")}
      </label>
      <select
        id="language-switcher"
        name="locale"
        // Shows "EN", so a two-letter abbreviation has to be unambiguous at a
        // glance. Spanish and English are about as close as two codes get, which
        // is why the icon and the sr-only label are not decoration.
        value={locale}
        disabled={pending}
        title={t("shell.languageHint")}
        aria-label={t("shell.language")}
        onChange={(event) => change(event.target.value)}
        className="cursor-pointer rounded-lg border border-zinc-300 bg-white py-1.5 pl-2 pr-7 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:focus-visible:outline-zinc-100"
      >
        {LOCALES.map((code: Locale) => (
          <option key={code} value={code}>
            {LOCALE_SHORT_LABELS[code]}
          </option>
        ))}
      </select>
      <span className="sr-only">{LOCALE_LABELS[locale]}</span>
    </div>
  );
}