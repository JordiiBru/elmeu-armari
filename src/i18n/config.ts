export const locales = ["ca", "es", "en"] as const;

export type Locale = (typeof locales)[number];

/** Catalan is the source language: keys are written here first, and it is
 * what the app falls back to when no choice has been made. */
export const defaultLocale: Locale = "ca";

export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}
