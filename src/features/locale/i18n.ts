import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { locales, sourceLocale, type Locale } from '@/domain';
import en from './messages/en.json';
import pl from './messages/pl.json';

export const appNamespace = 'app';

export function createI18n(initialLocale: Locale): i18n {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    lng: initialLocale,
    fallbackLng: sourceLocale,
    supportedLngs: [...locales],
    defaultNS: appNamespace,
    ns: [appNamespace],
    resources: { en: { [appNamespace]: en }, pl: { [appNamespace]: pl } },
    initAsync: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}
