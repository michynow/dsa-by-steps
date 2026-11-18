import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useParams } from 'react-router';
import { LocaleSwitcher } from '@/features/locale';
import styles from './Shell.module.css';

export function Shell(): ReactElement {
  const { t } = useTranslation();
  const { locale = '' } = useParams();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to={`/${locale}`} className={styles.brand} aria-label={t('shell.home')}>
          {t('course.title')}
        </Link>
        <LocaleSwitcher />
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
