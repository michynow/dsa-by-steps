import type { ReactElement } from 'react';
import { useMessages } from '@/features/locale';
import { lessonPlayerMessages } from './messages';
import styles from './CaptionStrip.module.css';

export function LessonError(): ReactElement {
  const { error } = useMessages(lessonPlayerMessages);
  return (
    <section role="alert" className={styles.strip}>
      <h2 className={styles.title}>{error.title}</h2>
      <p className={styles.caption}>{error.body}</p>
    </section>
  );
}
