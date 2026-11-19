import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import type { StepMessages } from '@/content';
import type { LessonPlayerMessages } from './messages';
import styles from './CaptionStrip.module.css';
import { StepControls } from './StepControls';
import type { StepNavigation } from './step-navigation';

export interface CaptionStripProps {
  readonly step: StepMessages | undefined;
  readonly problem: boolean;
  readonly showCaption: boolean;
  readonly panel: ReactNode;
  readonly practice: string | undefined;
  readonly messages: LessonPlayerMessages;
  readonly navigation: StepNavigation;
}

export function CaptionStrip({
  step,
  problem,
  showCaption,
  panel,
  practice,
  messages,
  navigation,
}: CaptionStripProps): ReactElement {
  return (
    <section className={styles.strip} aria-labelledby={showCaption ? 'step-title' : undefined}>
      {showCaption && step !== undefined ? (
        <>
          {problem ? <p className={styles.problem}>{messages.rail.problem}</p> : null}
          <h2 id="step-title" className={styles.title}>
            {step.title}
          </h2>
          <p className={styles.caption}>{step.caption}</p>
        </>
      ) : null}
      {panel}
      {practice === undefined ? null : (
        <Link to={practice} className={styles.practice}>
          {messages.caption.practice}
        </Link>
      )}
      <StepControls navigation={navigation} messages={messages} />
    </section>
  );
}
