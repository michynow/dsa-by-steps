import type { ReactElement } from 'react';
import type { LessonMessages, TermId } from '@/content';
import type { LessonPlayerMessages } from './messages';
import styles from './Panel.module.css';

export interface TermsPanelProps {
  readonly terms: readonly TermId[];
  readonly lessonMessages: LessonMessages;
  readonly messages: LessonPlayerMessages;
}

export function TermsPanel({
  terms,
  lessonMessages,
  messages,
}: TermsPanelProps): ReactElement | null {
  if (terms.length === 0) return null;
  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>{messages.panels.terms}</summary>
      <dl className={styles.list}>
        {terms.map((id) => (
          <div key={id}>
            <dt>{lessonMessages.terms[id]?.term}</dt>
            <dd>{lessonMessages.terms[id]?.gloss}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
