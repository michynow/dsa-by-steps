import type { ReactElement } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import type { ModuleContent } from '@/content';
import { ExerciseView } from '@/features/exercise';
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
  const backToLesson = (
    <Link to={`/${locale}/${module}/${lesson}`}>{messages.exercise.backToLesson}</Link>
  );
  if (content.exercise !== undefined) {
    return (
      <>
        <ExerciseView key={`${module}/${lesson}`} content={content} exercise={content.exercise} />
        <p>{backToLesson}</p>
      </>
    );
  }
  return (
    <section aria-labelledby="practice-detail-title">
      <h1 id="practice-detail-title" className={styles.title}>
        {content.messages[locale].title}
      </h1>
      <p>{messages.exercise.status}</p>
      {backToLesson}
    </section>
  );
}
