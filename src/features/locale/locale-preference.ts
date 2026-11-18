import { isLocale, type Locale } from '@/domain';

const storageKey = 'dsa-by-steps.locale';

export interface LocalePreferenceStore {
  read(): Locale | undefined;
  write(locale: Locale): void;
}

export function createLocalePreferenceStore(storage: Storage | undefined): LocalePreferenceStore {
  return {
    read() {
      try {
        const stored = storage?.getItem(storageKey) ?? '';
        return isLocale(stored) ? stored : undefined;
      } catch {
        return undefined;
      }
    },
    write(locale) {
      try {
        storage?.setItem(storageKey, locale);
      } catch {
        return;
      }
    },
  };
}
