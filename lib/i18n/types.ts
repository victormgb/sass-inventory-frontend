import type { en } from "./dictionaries/en";

/**
 * The shape every dictionary must satisfy.
 *
 * Derived from the English one rather than declared by hand, which is what turns a
 * missing translation into a build error instead of a runtime `undefined` rendered
 * into the page. With ~300 strings across ~36 files, "did I translate everything" is
 * not a question anyone can answer by reading the diff.
 */
export type Dictionary = typeof en;

/**
 * Every dot-path that resolves to a string.
 *
 * The leaf list is computed rather than written out so adding a key to the English
 * dictionary immediately makes it available everywhere, with no second list to keep
 * in sync. `t("sale.total")` will not compile for a path that does not exist, which
 * is the entire reason this is here.
 */
export type DictionaryKey = Leaves<Dictionary>;

type Leaves<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends Record<string, unknown>
      ? `${K}.${Leaves<T[K]>}`
      : never;
}[keyof T & string];

/**
 * Values substituted into `{placeholders}` in the dictionary.
 *
 * Deliberately not typed per key: a key like `itemsCount` wants a number in one
 * language and a string in another, and tying the argument to the key's type would
 * force every translation to keep the same JavaScript shape rather than letting it
 * use the grammar its language actually needs. The Spanish and English sentences
 * around a count are not the same sentence.
 */
export type TranslateValues = Record<string, string | number>;

export type Translate = (key: DictionaryKey, values?: TranslateValues) => string;

/**
 * Replaces `{name}` placeholders. Unknown placeholders are left untouched rather
 * than blanked, because a visible `{count}` in the page is a missing key someone
 * will notice, while a silently empty gap reads as intentional.
 */
export function interpolate(template: string, values?: TranslateValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}

export function createTranslate(dictionary: Dictionary): Translate {
  return (key, values) => {
    const template = key
      .split(".")
      .reduce<unknown>(
        (node, segment) =>
          node && typeof node === "object"
            ? (node as Record<string, unknown>)[segment]
            : undefined,
        dictionary,
      );

    if (typeof template !== "string") {
      throw new Error(`Missing translation for "${key}".`);
    }

    return interpolate(template, values);
  };
}