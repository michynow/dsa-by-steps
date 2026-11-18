import { isLocale, sourceLocale, type Locale } from '@/domain';

export function localeFromLanguageTags(tags: readonly string[]): Locale {
  for (const tag of tags) {
    const primary = tag.split('-')[0]?.toLowerCase() ?? '';
    if (isLocale(primary)) return primary;
  }
  return sourceLocale;
}

export function localeFromPath(pathname: string): Locale | undefined {
  const segment = pathname.split('/')[1] ?? '';
  return isLocale(segment) ? segment : undefined;
}

export function withLocale(pathname: string, locale: Locale): string {
  const [, , ...rest] = pathname.split('/');
  return ['', locale, ...rest].join('/');
}
