import type { ReactElement } from 'react';
import type { LessonContent } from '@/content';
import { lessonKey } from '@/domain';
import type { Course, Locale } from '@/domain';
import { useMessages } from '@/features/locale';
import { practicePath } from '@/features/practice';
import { CaptionStrip } from './CaptionStrip';
import styles from './LessonLayout.module.css';
import { lessonPlayerMessages } from './messages';
import { LessonPanels } from './LessonPanels';
import { Stage } from './Stage';
import type { UseStepCheck } from './step-check';
import { StepRail } from './StepRail';
import { useBoundCheck } from './use-bound-check';
import { useDocumentTitle } from './use-document-title';
import { useLessonScenes, useStepFrames } from './use-lesson-scenes';
import { useMarkStepSeen } from './use-mark-step-seen';
import { useStepNavigation } from './use-step-navigation';

export interface LessonLayoutProps {
  readonly course: Course;
  readonly content: LessonContent;
  readonly locale: Locale;
  readonly step: number;
  readonly useStepCheck: UseStepCheck;
}

function practiceLinkOf(content: LessonContent, locale: Locale, step: number): string | undefined {
  const { lesson } = content;
  return step === lesson.steps.length - 1
    ? practicePath(locale, content.module, lesson.slug)
    : undefined;
}

export function LessonLayout({
  course,
  content,
  locale,
  step,
  useStepCheck,
}: LessonLayoutProps): ReactElement {
  const messages = useMessages(lessonPlayerMessages);
  const lessonMessages = content.messages[locale];
  const { lesson } = content;
  const key = lessonKey(content.module, lesson.slug);
  const binding = useBoundCheck(useStepCheck, content, locale, step);
  const current = lesson.steps[step];
  const practiceLink = practiceLinkOf(content, locale, step);
  const gated = current?.check !== undefined && !binding.settled;
  const scenes = useLessonScenes(lesson, key);
  const frames = useStepFrames(lesson, scenes, step, gated);
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
        />
        <div className={styles.main}>
          <Stage
            frames={frames}
            messages={messages}
            selection={binding.selection}
            turn={gated}
            stepId={current?.id ?? ''}
          />
          <CaptionStrip
            step={current === undefined ? undefined : lessonMessages.steps[current.id]}
            problem={current?.kind === 'problem'}
            showCaption={!gated}
            panel={binding.panel}
            practice={practiceLink}
            messages={messages}
            navigation={navigation}
          />
          <LessonPanels content={content} lessonMessages={lessonMessages} messages={messages} />
        </div>
      </div>
    </div>
  );
}
