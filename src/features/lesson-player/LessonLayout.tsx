import type { ReactElement } from 'react';
import type { LessonContent } from '@/content';
import type { Course, Locale } from '@/domain';
import { useMessages } from '@/features/locale';
import { lessonFraming } from '@/features/story';
import { captionGlossary } from '@/features/terms';
import { practicePath } from '@/features/practice';
import { CaptionStrip } from './CaptionStrip';
import styles from './LessonLayout.module.css';
import { lessonPlayerMessages } from './messages';
import { LessonPanels } from './LessonPanels';
import { Stage } from './Stage';
import type { UseStepCheck } from './step-check';
import { StepRail } from './StepRail';
import { useDocumentTitle } from './use-document-title';
import { useLessonState } from './use-lesson-state';

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
  const { key, current, binding, gated, frames, navigation } = useLessonState(
    course,
    content,
    locale,
    step,
    useStepCheck,
  );
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
            lessonKey={key}
          />
          <CaptionStrip
            step={current === undefined ? undefined : lessonMessages.steps[current.id]}
            glossary={captionGlossary(content, locale, step)}
            framing={lessonFraming(lessonMessages, step, lesson.steps.length)}
            problem={current?.kind === 'problem'}
            showCaption={!gated}
            panel={binding.panel}
            practice={practiceLinkOf(content, locale, step)}
            messages={messages}
            navigation={navigation}
          />
          <LessonPanels content={content} locale={locale} messages={messages} step={step} />
        </div>
      </div>
    </div>
  );
}
