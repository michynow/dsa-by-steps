import { isLocale, locales, sourceLocale } from './locale';

describe('isLocale', () => {
  it.each(locales)('accepts %s', (locale) => {
    expect(isLocale(locale)).toBe(true);
  });

  it.each(['', 'EN', 'de', 'en-GB'])('rejects %j', (value) => {
    expect(isLocale(value)).toBe(false);
  });

  it('treats English as the source Locale', () => {
    expect(sourceLocale).toBe('en');
  });
});
