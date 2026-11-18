import type { ReactElement } from 'react';
import { Button } from '@/ui';
import type { LessonPlayerMessages } from './messages';
import styles from './StepControls.module.css';
import type { StepNavigation } from './step-navigation';

export interface StepControlsProps {
  readonly navigation: StepNavigation;
  readonly messages: LessonPlayerMessages;
}

const reasonId = 'next-reason';

export function StepControls({ navigation, messages }: StepControlsProps): ReactElement {
  const { previousPath, nextPath, nextBlocked, go } = navigation;
  return (
    <div role="group" aria-label={messages.caption.navigation} className={styles.controls}>
      <Button
        disabled={previousPath === undefined}
        onClick={() => {
          if (previousPath !== undefined) go(previousPath);
        }}
      >
        {messages.caption.previous}
      </Button>
      <Button
        disabled={nextPath === undefined}
        aria-disabled={nextBlocked}
        aria-describedby={nextBlocked ? reasonId : undefined}
        onClick={() => {
          if (nextPath !== undefined && !nextBlocked) go(nextPath);
        }}
      >
        {messages.caption.next}
      </Button>
      {nextBlocked ? (
        <p id={reasonId} className={styles.reason}>
          {messages.caption.nextBlocked}
        </p>
      ) : null}
    </div>
  );
}
