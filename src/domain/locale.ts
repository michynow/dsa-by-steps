export const locales = ['en', 'pl'] as const;

export type Locale = (typeof locales)[number];

export const sourceLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return locales.some((locale) => locale === value);
}
