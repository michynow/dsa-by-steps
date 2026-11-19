import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { CheckMessages } from '@/content';
import { canReveal, missesBeforeReveal } from '@/domain';
import { Button } from '@/ui';
import { useMessages } from '../locale';
import { checkText } from './check-text';
import type { CheckText } from './check-text';
import { formatTemplate } from './format-template';
import { OrderCheckCard } from './OrderCheckCard';
import { ChoiceOptions } from './ChoiceOptions';
import type { CheckSession } from './use-check-session';
import styles from './checks.module.css';

function feedbackOf(session: CheckSession, text: CheckText, empty: boolean): string {
  if (session.state.status === 'passed') return text.passed;
  if (session.state.status === 'revealed') return text.revealed;
  if (empty) return session.check.kind === 'choice' ? text.emptyChoice : text.emptyPredict;
  return session.lastVerdict === 'miss' ? text.miss : '';
}

function headerOf(session: CheckSession, text: CheckText): string {
  if (session.state.status === 'passed') return `${text.region} · ${text.doneCorrect}`;
  if (session.state.status === 'revealed') return `${text.region} · ${text.doneRevealed}`;
  return text.header;
}

function panelClass(session: CheckSession): string {
  return session.settled ? `${styles.panel} ${styles.done}` : styles.panel;
}

function missesOf(session: CheckSession, text: CheckText): string | null {
  if (session.state.status !== 'open' || session.state.misses === 0) return null;
  return formatTemplate(text.misses, {
    count: String(session.state.misses),
    max: String(missesBeforeReveal),
  });
}

export function CheckPanel(props: {
  readonly session: CheckSession;
  readonly messages: CheckMessages;
}): ReactElement {
  const { session, messages } = props;
  const text = useMessages(checkText);
  const promptId = useId();
  const [emptyFor, setEmptyFor] = useState<string | null>(null);
  const actedOn = useRef<string | null>(null);

  if (session.check.kind === 'order') {
    return <OrderCheckCard messages={messages} />;
  }

  const misses = missesOf(session, text);
  const empty = emptyFor === session.check.id && session.pending === null;
  const submit = (): void => {
    setEmptyFor(session.pending === null ? session.check.id : null);
    actedOn.current = session.check.id;
    session.submit();
  };
  const showMe = (): void => {
    actedOn.current = session.check.id;
    session.reveal();
  };
  const focusOnMount = (node: HTMLParagraphElement | null): void => {
    if (node && actedOn.current === session.check.id) {
      actedOn.current = null;
      node.focus();
    }
  };

  return (
    <section className={panelClass(session)} aria-label={text.region}>
      <p className={styles.header}>{headerOf(session, text)}</p>
      <h3 id={promptId} className={styles.prompt}>
        {messages.prompt}
      </h3>
      {misses === null ? null : <p className={styles.misses}>{misses}</p>}
      <ChoiceOptions
        session={session}
        messages={messages}
        labelledBy={promptId}
        correctMark={text.correctOption}
        onSubmit={submit}
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
