import type { ReactElement } from 'react';
import type { Exercise } from '@/domain';
import { exampleCall } from './example-call';
import styles from './exercise.module.css';
import type { ExerciseMessages } from './messages';

export interface ExamplesPanelProps {
  readonly exercise: Exercise;
  readonly messages: ExerciseMessages;
}

export function ExamplesPanel({ exercise, messages }: ExamplesPanelProps): ReactElement {
  return (
    <section aria-labelledby="exercise-examples-title" className={styles.panel}>
      <h2 id="exercise-examples-title" className={styles.panelTitle}>
        {messages.examples.title}
      </h2>
      <p className={styles.examplesNote}>{messages.examples.note}</p>
      <pre className={styles.examples}>
        <code>
          {exercise.visibleTests.map((test) => exampleCall(exercise.functionName, test)).join('\n')}
        </code>
      </pre>
    </section>
  );
}
