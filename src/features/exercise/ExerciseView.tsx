import type { ReactElement } from 'react';
import type { LessonContent } from '@/content';
import { exerciseProgressOf, lessonKey } from '@/domain';
import type { Exercise } from '@/domain';
import { useLocale, useMessages } from '@/features/locale';
import { useProgress, useProgressActions } from '@/features/progress';
import { CaptionText } from '@/features/terms';
import { EditorColumn } from './EditorColumn';
import { ExamplesPanel } from './ExamplesPanel';
import { HintsPanel } from './HintsPanel';
import { ResultsPanel } from './ResultsPanel';
import { SolutionPanel } from './SolutionPanel';
import { rejectionsToUnlock } from './exercise-rules';
import styles from './exercise.module.css';
import { exerciseMessages } from './messages';
import { useExerciseCode } from './use-exercise-code';
import { useExerciseRun } from './use-exercise-run';

export interface ExerciseViewProps {
  readonly content: LessonContent;
  readonly exercise: Exercise;
}

export function ExerciseView({ content, exercise }: ExerciseViewProps): ReactElement | null {
  const messages = useMessages(exerciseMessages);
  const locale = useLocale();
  const lesson = lessonKey(content.module, content.lesson.slug);
  const texts = content.messages[locale].exercise;
  const code = useExerciseCode(lesson, exercise.starterCode);
  const progress = useProgress((all) => exerciseProgressOf(all, lesson));
  const actions = useProgressActions();
  const run = useExerciseRun(exercise, lesson, () => code.latest.current);
  if (texts === undefined) return null;
  return (
    <article aria-labelledby="exercise-title" className={styles.exercise}>
      <h1 id="exercise-title" className={styles.title}>
        {texts.title}
      </h1>
      <p className={styles.task}>
        <CaptionText
          text={texts.task}
          glossary={{ terms: content.messages[locale].terms, introduced: [] }}
        />
      </p>
      <ExamplesPanel exercise={exercise} messages={messages} />
      <p className={styles.narrow}>{messages.narrow}</p>
      <div className={styles.columns}>
        <EditorColumn exercise={exercise} code={code} run={run} messages={messages} />
        <ResultsPanel
          result={run.result}
          exercise={exercise}
          messages={messages}
          labels={messages.scene}
        />
      </div>
      <HintsPanel
        hints={texts.hints}
        taken={progress.hintsTaken}
        messages={messages}
        onTake={() => {
          actions.takeHint(lesson, exercise.hintCount);
        }}
      />
      <SolutionPanel
        solution={exercise.referenceSolution}
        unlocked={progress.passed || progress.rejections >= rejectionsToUnlock}
        messages={messages}
      />
    </article>
  );
}
