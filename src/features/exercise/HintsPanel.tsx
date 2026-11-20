import type { ReactElement } from 'react';
import { Button } from '@/ui';
import styles from './exercise.module.css';
import { fill } from './fill';
import type { ExerciseMessages } from './messages';
import { CodeText } from '@/features/terms';

export interface HintsPanelProps {
  readonly hints: readonly string[];
  readonly taken: number;
  readonly messages: ExerciseMessages;
  readonly onTake: () => void;
}

export function HintsPanel({ hints, taken, messages, onTake }: HintsPanelProps): ReactElement {
  const exhausted = taken >= hints.length;
  return (
    <section aria-labelledby="exercise-hints-title" className={styles.panel}>
      <h2 id="exercise-hints-title" className={styles.panelTitle}>
        {messages.hints.title}
      </h2>
      <ol className={styles.hintList}>
        {hints.slice(0, taken).map((hint, index) => (
          <li key={index}>
            <span className={styles.hintLabel}>
              {fill(messages.hints.item, { number: String(index + 1) })}
            </span>{' '}
            <CodeText text={hint} />
          </li>
        ))}
      </ol>
      {exhausted ? (
        <p>{messages.hints.none}</p>
      ) : (
        <Button onClick={onTake}>
          {fill(messages.hints.show, { number: String(taken + 1), count: String(hints.length) })}
        </Button>
      )}
    </section>
  );
}
