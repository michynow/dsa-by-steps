import type { ReactElement } from 'react';
import { Link } from 'react-router';
import type { LessonContent } from '@/content';
import { exerciseProgressOf, lessonKey } from '@/domain';
import { useLocale, useMessages } from '@/features/locale';
import { useProgress } from '@/features/progress';
import styles from './PracticePage.module.css';
import { practiceMessages } from './messages';
import { practicePath } from './practice-paths';

export function PracticeCard({ content }: { readonly content: LessonContent }): ReactElement {
  const messages = useMessages(practiceMessages);
  const locale = useLocale();
  const passed = useProgress(
    (progress) =>
      exerciseProgressOf(progress, lessonKey(content.module, content.lesson.slug)).passed,
  );
  const status =
    content.exercise === undefined
      ? messages.exercise.status
      : passed
        ? messages.exercise.passed
        : messages.exercise.available;
  return (
    <Link to={practicePath(locale, content.module, content.lesson.slug)} className={styles.card}>
      <span className={styles.name}>{content.messages[locale].title}</span>{' '}
      <span className={styles.status}>{status}</span>
    </Link>
  );
}
