import type { ReactElement } from 'react';
import type { LessonContent, LessonMessages } from '@/content';
import type { LessonPlayerMessages } from './messages';
import { OutcomesPanel } from './OutcomesPanel';
import { TermsPanel } from './TermsPanel';

export interface LessonPanelsProps {
  readonly content: LessonContent;
  readonly lessonMessages: LessonMessages;
  readonly messages: LessonPlayerMessages;
}

export function LessonPanels({
  content,
  lessonMessages,
  messages,
}: LessonPanelsProps): ReactElement {
  return (
    <>
      <OutcomesPanel
        outcomes={content.lesson.outcomes}
        lessonMessages={lessonMessages}
        messages={messages}
      />
      <TermsPanel terms={content.terms} lessonMessages={lessonMessages} messages={messages} />
    </>
  );
}
