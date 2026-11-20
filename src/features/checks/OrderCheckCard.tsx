import type { ReactElement } from 'react';
import type { CheckMessages } from '@/content';
import styles from './checks.module.css';
import { CodeText } from '@/features/terms';

export function OrderCheckCard(props: { readonly messages: CheckMessages }): ReactElement {
  const { messages } = props;
  return (
    <div className={styles.info}>
      <p className={styles.prompt}>
        <CodeText text={messages.prompt} />
      </p>
      <p>
        <CodeText text={messages.explanation} />
      </p>
    </div>
  );
}
