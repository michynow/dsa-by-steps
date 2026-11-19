import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import type { ModuleContent } from '@/content';
import { segmentOf } from '@/features/lesson-player';
import { useLocale } from '@/features/locale';
import styles from './CourseHome.module.css';

export function CourseHome({
  modules,
}: {
  readonly modules: readonly ModuleContent[];
}): ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const { locale: path = '' } = useParams();

  return (
    <section aria-labelledby="course-title">
      <h1 id="course-title" className={styles.title}>
        {t('course.title')}
      </h1>
      <p className={styles.tagline}>{t('course.tagline')}</p>
      {modules.map((module) => (
        <section
          key={module.slug}
          aria-labelledby={`module-${module.slug}`}
          className={styles.module}
        >
          <h2 id={`module-${module.slug}`}>{module.titles[locale]}</h2>
          {module.lessons.length === 0 ? null : (
            <ul className={styles.lessons}>
              {module.lessons.map((lesson) => (
                <li key={lesson.lesson.slug}>
                  <Link to={`/${path}/${module.slug}/${lesson.lesson.slug}/${segmentOf(0)}`}>
                    {lesson.messages[locale].title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </section>
  );
}
