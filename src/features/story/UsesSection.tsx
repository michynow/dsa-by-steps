import type { ReactElement } from 'react';
import { useMessages } from '@/features/locale';
import { CaptionText } from '@/features/terms';
import type { CaptionGlossary } from '@/features/terms';
import type { LessonOutro } from './lesson-framing';
import { storyMessages } from './messages';
import styles from './UsesSection.module.css';

export interface UsesSectionProps {
  readonly outro: LessonOutro;
  readonly glossary: CaptionGlossary;
}

export function UsesSection({ outro, glossary }: UsesSectionProps): ReactElement {
  const messages = useMessages(storyMessages);
  const plain = { ...glossary, introduced: [] };
  return (
    <section className={styles.section} aria-labelledby="uses-title">
      <h3 id="uses-title" className={styles.heading}>
        {messages.uses}
      </h3>
      <ul className={styles.list}>
        {outro.uses.map((use) => (
          <li key={use.title}>
            <strong>{use.title}</strong> <CaptionText text={use.body} glossary={plain} />
          </li>
        ))}
      </ul>
      <p className={styles.whenNot}>
        <strong>{messages.whenNot}</strong> <CaptionText text={outro.whenNot} glossary={plain} />
      </p>
    </section>
  );
}
