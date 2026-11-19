import type { ReactElement } from 'react';
import type { CheckMessages } from '@/content';
import type { CheckText } from './check-text';
import styles from './checks.module.css';

export function OrderCheckCard(props: {
  readonly messages: CheckMessages;
  readonly text: CheckText;
}): ReactElement {
  const { messages, text } = props;
  return (
    <section className={styles.panel} aria-label={text.region}>
      <p className={styles.header}>{text.header}</p>
      <h3 className={styles.prompt}>{messages.prompt}</h3>
      <p>{messages.explanation}</p>
    </section>
  );
}
