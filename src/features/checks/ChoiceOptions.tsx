import type { ReactElement } from 'react';
import type { CheckMessages } from '@/content';
import type { CheckSession } from './use-check-session';
import styles from './checks.module.css';

export function ChoiceOptions(props: {
  readonly session: CheckSession;
  readonly messages: CheckMessages;
  readonly labelledBy: string;
  readonly correctMark: string;
  readonly onSubmit: () => void;
}): ReactElement | null {
  const { session, messages, labelledBy, correctMark, onSubmit } = props;
  const { check } = session;
  if (check.kind !== 'choice') return null;
  const shown = session.settled ? check.correct : session.pending;
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={styles.options}>
      {check.options.map((option) => {
        const label = messages.options?.[option];
        if (label === undefined) return null;
        const markId = `${labelledBy}-${option}`;
        const isMarked = session.settled && option === check.correct;
        return (
          <div key={option} className={styles.option}>
            <label className={styles.option}>
              <input
                type="radio"
                name={check.id}
                value={option}
                aria-describedby={isMarked ? markId : undefined}
                checked={shown === option}
                disabled={session.settled}
                onChange={() => {
                  session.choose(option);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  onSubmit();
                }}
              />
              <span>{label}</span>
            </label>
            {isMarked ? (
              <span id={markId} className={styles.mark}>
                {correctMark}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
