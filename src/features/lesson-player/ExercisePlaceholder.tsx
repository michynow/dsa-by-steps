import type { ReactElement } from 'react';
import type { LessonPlayerMessages } from './messages';
import { StepControls } from './StepControls';
import type { StepNavigation } from './step-navigation';
import styles from './CaptionStrip.module.css';

export interface ExercisePlaceholderProps {
  readonly messages: LessonPlayerMessages;
  readonly navigation: StepNavigation;
}

export function ExercisePlaceholder({
  messages,
  navigation,
}: ExercisePlaceholderProps): ReactElement {
  return (
    <section className={styles.strip} aria-labelledby="exercise-title">
      <h2 id="exercise-title" className={styles.title}>
        {messages.exercise.title}
      </h2>
      <p className={styles.caption}>{messages.exercise.soon}</p>
      <StepControls navigation={navigation} messages={messages} />
    </section>
  );
}
