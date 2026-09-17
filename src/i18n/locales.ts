export type LocaleCode = "en" | "es";

export interface LocaleConfig {
  /** Locale key used for path prefixes and content dictionary lookups. */
  code: LocaleCode;
  /** URL path segment; "" for the default (unprefixed) locale. */
  path: string;
  /** BCP47 code used in hreflang and <html lang>. */
  hreflang: string;
  /** language_TERRITORY form used in og:locale. */
  ogLocale: string;
  /** Native-language display name, for a future language switcher. */
  label: string;
}

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LOCALES: LocaleConfig[] = [
  { code: "en", path: "", hreflang: "en", ogLocale: "en_US", label: "English" },
  { code: "es", path: "es", hreflang: "es", ogLocale: "es_ES", label: "Español" },
];

export function getLocale(code: LocaleCode): LocaleConfig {
  const found = LOCALES.find((l) => l.code === code);
  if (!found) throw new Error(`Unknown locale: ${code}`);
  return found;
}

/**
 * Builds an absolute, locale-prefixed path for a page slug.
 * `slug` is "" for the home page, otherwise a path like "mortgage-calculator".
 */
export function localizedPath(code: LocaleCode, slug: string): string {
  const { path } = getLocale(code);
  if (path === "") return slug === "" ? "/" : `/${slug}`;
  return slug === "" ? `/${path}` : `/${path}/${slug}`;
}
