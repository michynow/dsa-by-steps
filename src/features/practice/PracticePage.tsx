import type { ReactElement } from 'react';
import type { ModuleContent } from '@/content';
import { useLocale, useMessages } from '@/features/locale';
import styles from './PracticePage.module.css';
import { practiceMessages } from './messages';
import { PracticeCard } from './PracticeCard';

export function PracticePage({
  modules,
}: {
  readonly modules: readonly ModuleContent[];
}): ReactElement {
  const messages = useMessages(practiceMessages);
  const locale = useLocale();
  return (
    <section aria-labelledby="practice-title">
      <h1 id="practice-title" className={styles.title}>
        {messages.page.title}
      </h1>
      {modules.map((module) => (
        <section
          key={module.slug}
          aria-labelledby={`practice-module-${module.slug}`}
          className={styles.module}
        >
          <h2 id={`practice-module-${module.slug}`}>{module.titles[locale]}</h2>
          {module.lessons.length === 0 ? null : (
            <ul className={styles.cards}>
              {module.lessons.map((content) => (
                <li key={content.lesson.slug}>
                  <PracticeCard content={content} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </section>
  );
}
