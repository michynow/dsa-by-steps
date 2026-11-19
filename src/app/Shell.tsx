import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useParams } from 'react-router';
import type { ModuleContent } from '@/content';
import { ModuleProgressBar } from '@/features/lesson-player';
import { LocaleSwitcher } from '@/features/locale';
import { ModeSwitch } from '@/features/practice';
import styles from './Shell.module.css';

export function Shell({ modules }: { readonly modules: readonly ModuleContent[] }): ReactElement {
  const { t } = useTranslation();
  const { locale = '', module, lesson } = useParams();
  const practising = useLocation().pathname.split('/')[2] === 'practice';

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to={`/${locale}`} className={styles.brand} aria-label={t('shell.home')}>
          {t('course.title')}
        </Link>
        <ModeSwitch />
        {practising || module === undefined || lesson === undefined ? null : (
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
