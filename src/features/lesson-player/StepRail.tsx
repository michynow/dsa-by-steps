import type { ReactElement } from 'react';
import type { LessonContent, LessonMessages } from '@/content';
import { exerciseProgressOf, lessonKey, stepsSeenIn } from '@/domain';
import type { Locale } from '@/domain';
import { useProgress } from '@/features/progress';
import type { LessonPlayerMessages } from './messages';
import styles from './StepRail.module.css';
import { StepRailEntry } from './StepRailEntry';
import type { RailStatus } from './StepRailEntry';
import { exerciseSegment, segmentOf } from './step-route';

export interface StepRailProps {
  readonly content: LessonContent;
  readonly lessonMessages: LessonMessages;
  readonly messages: LessonPlayerMessages;
  readonly locale: Locale;
  readonly current: number;
}

function statusOf(index: number, current: number, seen: boolean): RailStatus {
  if (index === current) return 'current';
  return seen ? 'seen' : 'unseen';
}

export function StepRail({
  content,
  lessonMessages,
  messages,
  locale,
  current,
}: StepRailProps): ReactElement {
  const { lesson } = content;
  const key = lessonKey(content.module, lesson.slug);
  const seen = useProgress((progress) => stepsSeenIn(progress, key));
  const exercisePassed = useProgress((progress) => exerciseProgressOf(progress, key).passed);
  const exerciseStatus = statusOf(lesson.steps.length, current, exercisePassed);
  const base = `/${locale}/${content.module}/${lesson.slug}`;
  return (
    <nav aria-label={messages.rail.label} className={styles.rail}>
      <ol className={styles.list}>
        {lesson.steps.map((step, index) => {
          const status = statusOf(index, current, seen.includes(step.id));
          return (
            <StepRailEntry
              key={step.id}
              to={`${base}/${segmentOf(lesson, index)}`}
              label={String(index + 1)}
              title={lessonMessages.steps[step.id]?.title ?? ''}
              status={status}
              statusText={messages.rail[status]}
              problemText={step.kind === 'problem' ? messages.rail.problem : undefined}
            />
          );
        })}
        <StepRailEntry
          to={`${base}/${exerciseSegment}`}
          label=""
          title={messages.rail.exercise}
          status={exerciseStatus}
          statusText={messages.rail[exerciseStatus]}
          problemText={undefined}
        />
      </ol>
    </nav>
  );
}
