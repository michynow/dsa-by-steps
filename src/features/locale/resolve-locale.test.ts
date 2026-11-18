import { localeFromLanguageTags, localeFromPath, withLocale } from './resolve-locale';

describe('localeFromLanguageTags', () => {
  it('matches on the primary subtag', () => {
    expect(localeFromLanguageTags(['pl-PL', 'en-US'])).toBe('pl');
  });

  it('takes the first supported tag in preference order', () => {
    expect(localeFromLanguageTags(['de-DE', 'en-GB', 'pl'])).toBe('en');
  });

  it('falls back to the source Locale', () => {
    expect(localeFromLanguageTags(['de', 'fr'])).toBe('en');
    expect(localeFromLanguageTags([])).toBe('en');
  });
});

describe('localeFromPath', () => {
  it('reads the first path segment', () => {
    expect(localeFromPath('/pl/foundations/linked-lists/3')).toBe('pl');
  });

  it('returns undefined for unknown segments', () => {
    expect(localeFromPath('/')).toBeUndefined();
    expect(localeFromPath('/de/foundations')).toBeUndefined();
  });
});

describe('withLocale', () => {
  it('replaces the Locale segment and keeps the rest of the path', () => {
    expect(withLocale('/en/foundations/linked-lists/3', 'pl')).toBe(
      '/pl/foundations/linked-lists/3',
    );
  });

  it('handles the Locale root', () => {
    expect(withLocale('/en', 'pl')).toBe('/pl');
  });
});
