import type { ReactElement } from 'react';
import type { Exercise } from '@/domain';
import type { RunResult } from '@/runner';
import type { SceneLabels } from '@/renderer';
import styles from './exercise.module.css';
import { fill } from './fill';
import type { ExerciseMessages } from './messages';
import { OutcomeRow } from './OutcomeRow';

export interface ResultsPanelProps {
  readonly result: RunResult | null;
  readonly exercise: Exercise;
  readonly messages: ExerciseMessages;
  readonly labels: SceneLabels;
}

function ResultBody({ result, exercise, messages, labels }: ResultsPanelProps): ReactElement {
  if (result === null) return <p>{messages.results.empty}</p>;
  switch (result.kind) {
    case 'compile-error':
      return (
        <p role="alert" className={styles.problem}>
          {fill(messages.results.compileError, {
            line: String(result.error.line),
            column: String(result.error.column),
            message: result.error.message,
          })}
        </p>
      );
    case 'internal-error':
      return (
        <p role="alert" className={styles.problem}>
          {messages.results.internalError}
        </p>
      );
    case 'report': {
      const hiddenIds = new Set(exercise.hiddenTests.map((test) => test.id));
      return (
        <>
          <p className={styles.summary}>
            {result.report.passed ? messages.results.allPassed : messages.results.someFailed}
          </p>
          <ul className={styles.outcomes}>
            {result.report.outcomes.map((outcome) => (
              <OutcomeRow
                key={outcome.testId}
                outcome={outcome}
                hidden={hiddenIds.has(outcome.testId)}
                messages={messages}
                labels={labels}
              />
            ))}
          </ul>
        </>
      );
    }
  }
}

export function ResultsPanel(props: ResultsPanelProps): ReactElement {
  return (
    <section aria-labelledby="exercise-results-title" className={styles.panel}>
      <h2 id="exercise-results-title" className={styles.panelTitle}>
        {props.messages.results.title}
      </h2>
      <ResultBody {...props} />
    </section>
  );
}
