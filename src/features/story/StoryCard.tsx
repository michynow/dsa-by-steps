import { useId } from 'react';
import type { ReactElement } from 'react';
import type { StoryMessages } from '@/content';
import { CaptionText } from '@/features/terms';
import type { CaptionGlossary } from '@/features/terms';
import styles from './StoryCard.module.css';

export interface StoryCardProps {
  readonly story: StoryMessages;
  readonly glossary: CaptionGlossary;
}

export function StoryCard({ story, glossary }: StoryCardProps): ReactElement {
  const titleId = useId();
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <p id={titleId} className={styles.title}>
        {story.title}
      </p>
      <p className={styles.summary}>
        <CaptionText text={story.summary} glossary={{ ...glossary, introduced: [] }} />
      </p>
    </section>
  );
}
