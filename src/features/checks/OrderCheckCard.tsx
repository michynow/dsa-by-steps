import type { ReactElement } from 'react';
import type { CheckMessages } from '@/content';
import styles from './checks.module.css';

export function OrderCheckCard(props: { readonly messages: CheckMessages }): ReactElement {
  const { messages } = props;
  return (
    <div className={styles.info}>
      <p className={styles.prompt}>{messages.prompt}</p>
      <p>{messages.explanation}</p>
    </div>
  );
}
