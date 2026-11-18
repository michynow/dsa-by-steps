import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useParams } from 'react-router';
import type { ModuleContent } from '@/content';
import { ModuleProgressBar } from '@/features/lesson-player';
import { LocaleSwitcher } from '@/features/locale';
import styles from './Shell.module.css';

export function Shell({ modules }: { readonly modules: readonly ModuleContent[] }): ReactElement {
  const { t } = useTranslation();
  const { locale = '', module, lesson } = useParams();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to={`/${locale}`} className={styles.brand} aria-label={t('shell.home')}>
          {t('course.title')}
        </Link>
        {module === undefined || lesson === undefined ? null : (
          <ModuleProgressBar modules={modules} module={module} lesson={lesson} />
        )}
        <LocaleSwitcher />
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
