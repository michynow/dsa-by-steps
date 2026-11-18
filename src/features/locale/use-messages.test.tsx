import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createI18n } from './i18n';
import { useLocale, useMessages } from './use-messages';

const bundle = { en: { greeting: 'Hello' }, pl: { greeting: 'Cześć' } };

function wrapperFor(locale: 'en' | 'pl') {
  const i18n = createI18n(locale);
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }
  return { i18n, Wrapper };
}

describe('useMessages', () => {
  it('returns the bundle entry for the current Locale', () => {
    const { Wrapper } = wrapperFor('pl');
    const { result } = renderHook(() => useMessages(bundle), { wrapper: Wrapper });
    expect(result.current).toEqual({ greeting: 'Cześć' });
  });

  it('follows a Locale change', async () => {
    const { i18n, Wrapper } = wrapperFor('en');
    const { result } = renderHook(() => ({ locale: useLocale(), messages: useMessages(bundle) }), {
      wrapper: Wrapper,
    });
    expect(result.current).toEqual({ locale: 'en', messages: { greeting: 'Hello' } });
    await act(async () => {
      await i18n.changeLanguage('pl');
    });
    expect(result.current).toEqual({ locale: 'pl', messages: { greeting: 'Cześć' } });
  });

  it('falls back to the source Locale for an unsupported language', async () => {
    const { i18n, Wrapper } = wrapperFor('en');
    await act(async () => {
      await i18n.changeLanguage('de');
    });
    const { result } = renderHook(() => useLocale(), { wrapper: Wrapper });
    expect(result.current).toBe('en');
  });
});
