import type { ReactElement } from 'react';
import type { TestOutcome } from '@/domain';
import type { SceneLabels } from '@/renderer';
import styles from './exercise.module.css';
import type { ExerciseMessages } from './messages';
import { OutcomeDetail } from './OutcomeDetail';

export interface OutcomeRowProps {
  readonly outcome: TestOutcome;
  readonly hidden: boolean;
  readonly messages: ExerciseMessages;
  readonly labels: SceneLabels;
}

export function OutcomeRow({ outcome, hidden, messages, labels }: OutcomeRowProps): ReactElement {
  const statuses: Record<TestOutcome['kind'], string> = messages.status;
  return (
    <li className={styles.outcome} data-status={outcome.kind}>
      <p className={styles.outcomeHead}>
        <span className={styles.testId}>{outcome.testId}</span>
        {hidden ? <span className={styles.hiddenTag}>{messages.results.hiddenTest}</span> : null}
        <span className={styles.status}>{statuses[outcome.kind]}</span>
      </p>
      {hidden ? null : <OutcomeDetail outcome={outcome} messages={messages} labels={labels} />}
    </li>
  );
}
