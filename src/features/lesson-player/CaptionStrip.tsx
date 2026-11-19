import { Fragment } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';
import type { StepMessages } from '@/content';
import { StoryCard, UsesSection } from '@/features/story';
import type { LessonFraming } from '@/features/story';
import { afterCaption, CaptionText, KeyIdea } from '@/features/terms';
import type { CaptionGlossary } from '@/features/terms';
import type { LessonPlayerMessages } from './messages';
import styles from './CaptionStrip.module.css';
import { StepControls } from './StepControls';
import type { StepNavigation } from './step-navigation';

export interface CaptionStripProps {
  readonly step: StepMessages | undefined;
  readonly glossary: CaptionGlossary;
  readonly framing: LessonFraming;
  readonly problem: boolean;
  readonly showCaption: boolean;
  readonly panel: ReactNode;
  readonly practice: string | undefined;
  readonly messages: LessonPlayerMessages;
  readonly navigation: StepNavigation;
}

export function CaptionStrip({
  step,
  glossary,
  framing,
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
        <Fragment key={step.title}>
          {problem ? <p className={styles.problem}>{messages.rail.problem}</p> : null}
          {framing.story === undefined ? null : (
            <StoryCard story={framing.story} glossary={glossary} />
          )}
          <h2 id="step-title" className={styles.title}>
            {step.title}
          </h2>
          <p className={styles.caption}>
            <CaptionText text={step.caption} glossary={glossary} />
          </p>
          {step.keyIdea === undefined ? null : (
            <KeyIdea text={step.keyIdea} glossary={afterCaption(glossary, step.caption)} />
          )}
          {framing.outro === undefined ? null : (
            <UsesSection outro={framing.outro} glossary={glossary} />
          )}
        </Fragment>
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
