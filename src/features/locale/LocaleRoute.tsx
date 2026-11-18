import { useLayoutEffect, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useParams } from 'react-router';
import { isLocale } from '@/domain';
import { useLocalePreference } from './useLocalePreference';

export function LocaleRoute(): ReactElement {
  const { locale = '' } = useParams();
  const { i18n } = useTranslation();
  const preference = useLocalePreference();
  const valid = isLocale(locale);

  useLayoutEffect(() => {
    if (!valid) return;
    document.documentElement.lang = locale;
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
  }, [i18n, locale, valid]);

  if (!valid) return <Navigate to={`/${preference.resolve()}`} replace />;
  return <Outlet />;
}
