import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './CourseHome.module.css';

export function CourseHome(): ReactElement {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="course-title">
      <h1 id="course-title" className={styles.title}>
        {t('course.title')}
      </h1>
      <p className={styles.tagline}>{t('course.tagline')}</p>
    </section>
  );
}
