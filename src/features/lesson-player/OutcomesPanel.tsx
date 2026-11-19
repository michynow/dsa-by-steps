import type { ReactElement } from 'react';
import type { LessonMessages } from '@/content';
import type { LessonPlayerMessages } from './messages';
import styles from './Panel.module.css';

export interface OutcomesPanelProps {
  readonly outcomes: readonly string[];
  readonly lessonMessages: LessonMessages;
  readonly messages: LessonPlayerMessages;
}

export function OutcomesPanel({
  outcomes,
  lessonMessages,
  messages,
}: OutcomesPanelProps): ReactElement | null {
  if (outcomes.length === 0) return null;
  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>{messages.panels.outcomes}</summary>
      <ul className={styles.list}>
        {outcomes.map((outcome) => (
          <li key={outcome}>{lessonMessages.outcomes[outcome]}</li>
        ))}
      </ul>
    </details>
  );
}
