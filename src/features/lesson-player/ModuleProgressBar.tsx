import type { ReactElement } from 'react';
import { courseOf } from '@/content';
import type { ModuleContent } from '@/content';
import { moduleProgress } from '@/domain';
import { useLocale, useMessages } from '@/features/locale';
import { useProgress } from '@/features/progress';
import { formatMessage } from './format-message';
import { lessonPlayerMessages } from './messages';
import styles from './ModuleProgressBar.module.css';

export interface ModuleProgressBarProps {
  readonly modules: readonly ModuleContent[];
  readonly module: string;
  readonly lesson: string;
}

export function ModuleProgressBar({
  modules,
  module,
  lesson,
}: ModuleProgressBarProps): ReactElement | null {
  const messages = useMessages(lessonPlayerMessages);
  const locale = useLocale();
  const content = modules.find((candidate) => candidate.slug === module);
  const passed = useProgress((progress) => {
    const result = moduleProgress(courseOf(modules), module, progress);
    return result.ok ? result.value.lessons.map((entry) => entry.passed) : [];
  });
  const position = content?.lessons.findIndex((entry) => entry.lesson.slug === lesson) ?? -1;
  if (content === undefined || position < 0) return null;
  return (
    <div role="group" aria-label={messages.progress.label} className={styles.bar}>
      <span className={styles.module}>{content.titles[locale]}</span>
      <span>
        {formatMessage(messages.progress.position, {
          number: String(position + 1),
          count: String(content.lessons.length),
        })}
      </span>
      <ol className={styles.segments}>
        {content.lessons.map((entry, index) => (
          <li
            key={entry.lesson.slug}
            className={styles.segment}
            data-passed={passed[index] === true}
            data-current={index === position}
          >
            <span className={styles.hidden}>{entry.messages[locale].title}</span>
            <span className={styles.hidden}>
              {passed[index] === true ? messages.progress.passed : messages.progress.notPassed}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
