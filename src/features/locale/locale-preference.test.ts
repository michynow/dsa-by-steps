import { createLocalePreferenceStore } from './locale-preference';

describe('createLocalePreferenceStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a Locale', () => {
    const store = createLocalePreferenceStore(localStorage);
    store.write('pl');
    expect(store.read()).toBe('pl');
  });

  it('ignores values that are not a Locale', () => {
    localStorage.setItem('dsa-by-steps.locale', 'de');
    expect(createLocalePreferenceStore(localStorage).read()).toBeUndefined();
  });

  it('survives storage that throws', () => {
    const failing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    const store = createLocalePreferenceStore(failing);
    expect(() => {
      store.write('pl');
    }).not.toThrow();
    expect(store.read()).toBeUndefined();
  });

  it('works without storage', () => {
    expect(createLocalePreferenceStore(undefined).read()).toBeUndefined();
  });
});
