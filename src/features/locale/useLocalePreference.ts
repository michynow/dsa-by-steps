import { useMemo } from 'react';
import type { Locale } from '@/domain';
import { createLocalePreferenceStore } from './locale-preference';
import { localeFromLanguageTags } from './resolve-locale';

export interface LocalePreference {
  resolve(): Locale;
  remember(locale: Locale): void;
}

export function useLocalePreference(): LocalePreference {
  return useMemo(() => {
    const store = createLocalePreferenceStore(globalThis.localStorage);
    return {
      resolve: () => store.read() ?? localeFromLanguageTags(navigator.languages),
      remember: (locale) => {
        store.write(locale);
      },
    };
  }, []);
}
