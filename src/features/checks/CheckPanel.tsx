import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { CheckMessages } from '@/content';
import { canReveal } from '@/domain';
import { Button } from '@/ui';
import { useMessages } from '../locale';
import { checkText } from './check-text';
import type { CheckText } from './check-text';
import { ChoiceOptions } from './ChoiceOptions';
import type { CheckSession } from './use-check-session';
import styles from './checks.module.css';

function feedbackOf(session: CheckSession, text: CheckText, empty: boolean): string {
  if (session.state.status === 'passed') return text.passed;
  if (session.state.status === 'revealed') return text.revealed;
  if (empty) return session.check.kind === 'choice' ? text.emptyChoice : text.emptyPredict;
  return session.lastVerdict === 'miss' ? text.miss : '';
}

export function CheckPanel(props: {
  readonly session: CheckSession;
  readonly messages: CheckMessages;
}): ReactElement {
  const { session, messages } = props;
  const text = useMessages(checkText);
  const promptId = useId();
  const [emptyTried, setEmptyTried] = useState(false);
  const focusExplanation = useRef(false);

  if (session.check.kind === 'order') {
    return (
      <section className={styles.panel}>
        <p>{messages.prompt}</p>
      </section>
    );
  }

  const empty = emptyTried && session.pending === null;
  const submit = (): void => {
    setEmptyTried(session.pending === null);
    focusExplanation.current = true;
    session.submit();
  };
  const showMe = (): void => {
    focusExplanation.current = true;
    session.reveal();
  };
  const focusOnMount = (node: HTMLParagraphElement | null): void => {
    if (node && focusExplanation.current) {
      focusExplanation.current = false;
      node.focus();
    }
  };

  return (
    <section className={styles.panel}>
      <p id={promptId}>{messages.prompt}</p>
      <ChoiceOptions
        session={session}
        messages={messages}
        labelledBy={promptId}
        correctMark={text.correctOption}
      />
      {session.check.kind === 'predict' && !session.settled ? <p>{text.predictHint}</p> : null}
      <div className={styles.controls}>
        {session.settled ? null : <Button onClick={submit}>{text.submit}</Button>}
        {canReveal(session.state) ? <Button onClick={showMe}>{text.reveal}</Button> : null}
      </div>
      <p role="status" aria-live="polite">
        {feedbackOf(session, text, empty)}
      </p>
      {session.settled ? (
        <p ref={focusOnMount} tabIndex={-1} className={styles.explanation}>
          {messages.explanation}
        </p>
      ) : null}
    </section>
  );
}
