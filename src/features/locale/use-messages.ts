import { useTranslation } from 'react-i18next';
import { isLocale, sourceLocale, type Locale } from '@/domain';

export type MessageBundle<T> = Readonly<Record<Locale, T>>;

export function useLocale(): Locale {
  const { i18n } = useTranslation();
  return isLocale(i18n.language) ? i18n.language : sourceLocale;
}

export function useMessages<T>(bundle: MessageBundle<T>): T {
  return bundle[useLocale()];
}
