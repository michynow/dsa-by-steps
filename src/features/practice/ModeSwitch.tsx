import type { ReactElement } from 'react';
import { Link, useLocation } from 'react-router';
import { useLocale, useMessages } from '@/features/locale';
import styles from './ModeSwitch.module.css';
import { practiceMessages } from './messages';
import { practiceIndexPath } from './practice-paths';

export function ModeSwitch(): ReactElement {
  const messages = useMessages(practiceMessages);
  const locale = useLocale();
  const { pathname } = useLocation();
  const practising = pathname.split('/')[2] === 'practice';
  return (
    <nav aria-label={messages.modes.label} className={styles.switch}>
      <Link
        to={`/${locale}`}
        className={styles.mode}
        aria-current={practising ? undefined : 'page'}
      >
        {messages.modes.learn}
      </Link>
      <Link
        to={practiceIndexPath(locale)}
        className={styles.mode}
        aria-current={practising ? 'page' : undefined}
      >
        {messages.modes.practice}
      </Link>
    </nav>
  );
}
