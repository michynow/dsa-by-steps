import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import type { LessonContent, ModuleContent } from '@/content';
import { LessonReel, segmentOf } from '@/features/lesson-player';
import { useLocale } from '@/features/locale';
import styles from './CourseHome.module.css';

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

function LessonRow({
  content,
  number,
  href,
}: {
  readonly content: LessonContent;
  readonly number: number;
  readonly href: string;
}): ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const messages = content.messages[locale];
  const count = content.lesson.steps.length;

  return (
    <li
      className={styles.row}
      style={{ animationDelay: `calc(${String(number)} * var(--motion-fast))` }}
    >
      <span className={styles.number}>{twoDigits(number)}</span>
      <div className={styles.body}>
        {count === 0 ? (
          <span className={styles.lessonTitle}>{messages.title}</span>
        ) : (
          <Link className={styles.lessonTitle} to={href}>
            {messages.title}
          </Link>
        )}
        <p className={styles.summary}>{messages.story.summary}</p>
      </div>
      <span className={styles.meta}>
        {count === 0 ? t('course.noSteps') : t('course.steps', { count })}
        {content.exercise === undefined ? null : (
          <span className={styles.badge}>{t('course.exercise')}</span>
        )}
      </span>
    </li>
  );
}

function ModuleSection({
  module,
  number,
  hrefOf,
}: {
  readonly module: ModuleContent;
  readonly number: number;
  readonly hrefOf: (module: string, lesson: string) => string;
}): ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();

  return (
    <section aria-labelledby={`module-${module.slug}`} className={styles.module}>
      <header className={styles.moduleHeader}>
        <span className={styles.moduleNumber}>
          {t('course.module', { number: twoDigits(number) })}
        </span>
        <h2 id={`module-${module.slug}`} className={styles.moduleTitle}>
          {module.titles[locale]}
        </h2>
      </header>
      {module.lessons.length === 0 ? null : (
        <ol className={styles.lessons}>
          {module.lessons.map((content, index) => (
            <LessonRow
              key={content.lesson.slug}
              content={content}
              number={index + 1}
              href={hrefOf(module.slug, content.lesson.slug)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

export function CourseHome({
  modules,
}: {
  readonly modules: readonly ModuleContent[];
}): ReactElement {
  const { t } = useTranslation();
  const locale = useLocale();
  const { locale: path = '' } = useParams();
  const lessons = modules.flatMap((module) => module.lessons);
  const hrefOf = (module: string, lesson: string): string =>
    `/${path}/${module}/${lesson}/${segmentOf(0)}`;
  const first = lessons.find((content) => content.lesson.steps.length > 0);

  return (
    <div className={styles.home}>
      <section aria-labelledby="course-title" className={styles.hero}>
        <div className={styles.intro}>
          <h1 id="course-title" className={styles.title}>
            {t('course.title')}
          </h1>
          <p className={styles.tagline}>{t('course.tagline')}</p>
          {first === undefined ? null : (
            <Link className={styles.start} to={hrefOf(first.module, first.lesson.slug)}>
              {t('course.start', { title: first.messages[locale].title })}
            </Link>
          )}
        </div>
        <LessonReel lessons={lessons} />
      </section>
      <div>
        {modules.map((module, index) => (
          <ModuleSection key={module.slug} module={module} number={index + 1} hrefOf={hrefOf} />
        ))}
      </div>
    </div>
  );
}
