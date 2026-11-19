import type { ReactElement } from 'react';
import type { LessonContent } from '@/content';
import type { Locale } from '@/domain';
import { useMessages } from '@/features/locale';
import { termsIntroducedBy } from './introduced-terms';
import { termsMessages } from './messages';
import styles from './TermsPanel.module.css';
import { TermChip } from './TermChip';

export interface TermsPanelProps {
  readonly content: LessonContent;
  readonly locale: Locale;
  readonly step: number;
}

export function TermsPanel({ content, locale, step }: TermsPanelProps): ReactElement | null {
  const messages = useMessages(termsMessages);
  const shown = termsIntroducedBy(content, step).flatMap((id) => {
    const term = content.messages[locale].terms[id];
    return term === undefined ? [] : [{ id, term }];
  });
  if (shown.length === 0) return null;
  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>{messages.panel}</summary>
      <ul className={styles.list}>
        {shown.map(({ id, term }) => (
          <li key={id}>
            <TermChip term={term} isNew={false} />
          </li>
        ))}
      </ul>
    </details>
  );
}
