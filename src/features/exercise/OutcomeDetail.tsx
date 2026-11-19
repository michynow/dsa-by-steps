import type { ReactElement } from 'react';
import { assertNever } from '@/domain';
import type { TestOutcome } from '@/domain';
import type { SceneLabels } from '@/renderer';
import styles from './exercise.module.css';
import { fill } from './fill';
import type { ExerciseMessages } from './messages';
import { ValueView } from './ValueView';

export interface OutcomeDetailProps {
  readonly outcome: TestOutcome;
  readonly messages: ExerciseMessages;
  readonly labels: SceneLabels;
}

function FailedDetail({
  outcome,
  messages,
  labels,
}: {
  readonly outcome: Extract<TestOutcome, { readonly kind: 'failed' }>;
  readonly messages: ExerciseMessages;
  readonly labels: SceneLabels;
}): ReactElement {
  return (
    <dl className={styles.values}>
      <dt>{messages.results.input}</dt>
      {outcome.args.map((arg, index) => (
        <dd key={index}>
          <ValueView value={arg} labels={labels} />
        </dd>
      ))}
      <dt>{messages.results.expected}</dt>
      <dd>
        <ValueView value={outcome.expected} labels={labels} />
      </dd>
      <dt>{messages.results.actual}</dt>
      <dd>
        <ValueView value={outcome.actual} labels={labels} />
      </dd>
    </dl>
  );
}

export function OutcomeDetail({
  outcome,
  messages,
  labels,
}: OutcomeDetailProps): ReactElement | null {
  const text = messages.results;
  switch (outcome.kind) {
    case 'passed':
      return null;
    case 'failed':
      return <FailedDetail outcome={outcome} messages={messages} labels={labels} />;
    case 'errored':
      return (
        <p className={styles.detail}>
          {outcome.reason === 'stack-overflow' ? text.stackOverflow : outcome.message}
        </p>
      );
    case 'skipped':
      return <p className={styles.detail}>{text.skipped}</p>;
    case 'timed-out':
      return (
        <p className={styles.detail}>{fill(text.timedOut, { ms: String(outcome.limitMs) })}</p>
      );
    case 'too-slow':
      return (
        <p className={styles.detail}>
          {fill(text.tooSlow, {
            ms: String(Math.round(outcome.durationMs)),
            budget: String(Math.round(outcome.budgetMs)),
            complexity: outcome.complexity,
          })}
        </p>
      );
    default:
      return assertNever(outcome);
  }
}
