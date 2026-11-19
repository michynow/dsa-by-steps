import type { ReactElement } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import type { ModuleContent } from '@/content';
import { useLocale, useMessages } from '@/features/locale';
import styles from './PracticePage.module.css';
import { practiceMessages } from './messages';
import { practiceIndexPath } from './practice-paths';

export function PracticeDetail({
  modules,
}: {
  readonly modules: readonly ModuleContent[];
}): ReactElement {
  const messages = useMessages(practiceMessages);
  const locale = useLocale();
  const { module = '', lesson = '' } = useParams();
  const content = modules
    .find((candidate) => candidate.slug === module)
    ?.lessons.find((candidate) => candidate.lesson.slug === lesson);
  if (content === undefined) return <Navigate to={practiceIndexPath(locale)} replace />;
  return (
    <section aria-labelledby="practice-detail-title">
      <h1 id="practice-detail-title" className={styles.title}>
        {content.messages[locale].title}
      </h1>
      <p>{messages.exercise.status}</p>
      <Link to={`/${locale}/${module}/${lesson}`}>{messages.exercise.backToLesson}</Link>
    </section>
  );
}
