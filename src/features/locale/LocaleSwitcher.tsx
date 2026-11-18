import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router';
import { locales, type Locale } from '@/domain';
import { Button } from '@/ui';
import styles from './LocaleSwitcher.module.css';
import { withLocale } from './resolve-locale';
import { useLocalePreference } from './useLocalePreference';

export function LocaleSwitcher(): ReactElement {
  const { t } = useTranslation();
  const { locale: current } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const preference = useLocalePreference();

  const select = (locale: Locale) => {
    preference.remember(locale);
    void navigate(withLocale(pathname, locale));
  };

  return (
    <fieldset className={styles.switcher}>
      <legend className={styles.legend}>{t('locale.label')}</legend>
      {locales.map((locale) => (
        <Button
          key={locale}
          lang={locale}
          aria-pressed={locale === current}
          onClick={() => {
            select(locale);
          }}
        >
          {t(`locale.name.${locale}`)}
        </Button>
      ))}
    </fieldset>
  );
}
