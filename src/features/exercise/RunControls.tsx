import type { ReactElement, RefObject } from 'react';
import type { RunMode } from '@/domain';
import { Button } from '@/ui';
import styles from './exercise.module.css';
import type { ExerciseMessages } from './messages';

export interface RunControlsProps {
  readonly running: RunMode | null;
  readonly messages: ExerciseMessages;
  readonly runButton: RefObject<HTMLButtonElement | null>;
  readonly onStart: (mode: RunMode) => void;
}

export function RunControls({
  running,
  messages,
  runButton,
  onStart,
}: RunControlsProps): ReactElement {
  const busy = running !== null;
  return (
    <div className={styles.controls}>
      <Button
        ref={runButton}
        aria-busy={busy}
        onClick={() => {
          onStart('run');
        }}
      >
        {messages.run}
      </Button>
      <Button
        aria-busy={busy}
        onClick={() => {
          onStart('submit');
        }}
      >
        {messages.submit}
      </Button>
      <div role="status" aria-live="polite" className={styles.live}>
        {busy ? messages.running : ''}
      </div>
    </div>
  );
}
