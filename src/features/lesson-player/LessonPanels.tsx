import type { ReactElement } from 'react';
import type { LessonContent } from '@/content';
import type { Locale } from '@/domain';
import { TermsPanel } from '@/features/terms';
import type { LessonPlayerMessages } from './messages';
import { OutcomesPanel } from './OutcomesPanel';

export interface LessonPanelsProps {
  readonly content: LessonContent;
  readonly locale: Locale;
  readonly messages: LessonPlayerMessages;
  readonly step: number;
}

export function LessonPanels({ content, locale, messages, step }: LessonPanelsProps): ReactElement {
  return (
    <>
      <OutcomesPanel
        outcomes={content.lesson.outcomes}
        lessonMessages={content.messages[locale]}
        messages={messages}
      />
      <TermsPanel content={content} locale={locale} step={step} />
    </>
  );
}
