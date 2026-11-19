import type { ReactElement } from 'react';
import { Link } from 'react-router';
import styles from './StepRail.module.css';

export type RailStatus = 'seen' | 'current' | 'unseen';

export interface StepRailEntryProps {
  readonly to: string;
  readonly label: string;
  readonly title: string;
  readonly status: RailStatus;
  readonly statusText: string;
  readonly problemText: string | undefined;
  readonly turnText: string | undefined;
}

export function StepRailEntry({
  to,
  label,
  title,
  status,
  statusText,
  problemText,
  turnText,
}: StepRailEntryProps): ReactElement {
  return (
    <li className={styles.entry} data-status={status}>
      <Link
        to={to}
        className={styles.link}
        aria-current={status === 'current' ? 'step' : undefined}
      >
        <span className={styles.marker} aria-hidden="true" />
        <span className={styles.number}>{label}</span> <span className={styles.title}>{title}</span>{' '}
        {problemText === undefined ? null : (
          <>
            <span className={styles.problem}>{problemText}</span>{' '}
          </>
        )}
        {turnText === undefined ? null : (
          <>
            <span className={styles.turn}>{turnText}</span>{' '}
          </>
        )}
        <span className={styles.hidden}>{statusText}</span>
      </Link>
    </li>
  );
}
