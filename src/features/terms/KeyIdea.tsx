import type { ReactElement } from 'react';
import { useMessages } from '@/features/locale';
import { CaptionText } from './CaptionText';
import type { CaptionTextProps } from './CaptionText';
import styles from './KeyIdea.module.css';
import { termsMessages } from './messages';

export function KeyIdea(props: CaptionTextProps): ReactElement {
  const messages = useMessages(termsMessages);
  return (
    <div role="note" className={styles.callout}>
      <p className={styles.label}>{messages.keyIdea}</p>
      <p className={styles.text}>
        <CaptionText {...props} />
      </p>
    </div>
  );
}
