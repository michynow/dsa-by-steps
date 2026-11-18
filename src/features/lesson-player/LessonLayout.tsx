import type { ReactElement } from 'react';
import type { LessonContent } from '@/content';
import { lessonKey, stepsSeenIn } from '@/domain';
import type { Course, Locale } from '@/domain';
import { useMessages } from '@/features/locale';
import { useProgress } from '@/features/progress';
import { CaptionStrip } from './CaptionStrip';
import { ExercisePlaceholder } from './ExercisePlaceholder';
import styles from './LessonLayout.module.css';
import { lessonPlayerMessages } from './messages';
import { LessonPanels } from './LessonPanels';
import { displayedScene } from './scene-choice';
import { Stage } from './Stage';
import type { StepCheckBinding } from './step-check';
import { StepRail } from './StepRail';
import { useDocumentTitle } from './use-document-title';
import { useLessonScenes } from './use-lesson-scenes';
import { useMarkStepSeen } from './use-mark-step-seen';
import { useStepNavigation } from './use-step-navigation';

export interface LessonLayoutProps {
  readonly course: Course;
  readonly content: LessonContent;
  readonly locale: Locale;
  readonly step: number;
  readonly binding: StepCheckBinding;
}

export function LessonLayout({
  course,
  content,
  locale,
  step,
  binding,
}: LessonLayoutProps): ReactElement {
  const messages = useMessages(lessonPlayerMessages);
  const lessonMessages = content.messages[locale];
  const { lesson } = content;
  const key = lessonKey(content.module, lesson.slug);
  const current = lesson.steps[step];
  const gated = current?.check !== undefined && !binding.settled;
  const scenes = useLessonScenes(lesson);
  const seen = useProgress((progress) => stepsSeenIn(progress, key));
  const navigation = useStepNavigation({
    course,
    locale,
    position: { module: content.module, lesson: lesson.slug, step },
    settled: binding.settled,
  });
  useMarkStepSeen(key, current?.id, binding.settled);
  useDocumentTitle(lessonMessages.title);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{lessonMessages.title}</h1>
      <div className={styles.body}>
        <StepRail
          content={content}
          lessonMessages={lessonMessages}
          messages={messages}
          locale={locale}
          current={step}
          seen={seen}
        />
        <div className={styles.main}>
          <Stage
            scene={displayedScene(lesson, scenes, step, gated)}
            messages={messages}
            selection={binding.selection}
          />
          {current === undefined ? (
            <ExercisePlaceholder messages={messages} navigation={navigation} />
          ) : (
            <CaptionStrip
              step={lessonMessages.steps[current.id]}
              problem={current.kind === 'problem'}
              showCaption={!gated}
              panel={binding.panel}
              messages={messages}
              navigation={navigation}
            />
          )}
          <LessonPanels content={content} lessonMessages={lessonMessages} messages={messages} />
        </div>
      </div>
    </div>
  );
}
