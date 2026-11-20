import { Fragment } from 'react';
import type { ReactElement } from 'react';
import { parseCaption } from '@/content';
import type { CaptionSegment, TermId } from '@/content';
import type { CaptionGlossary } from './introduced-terms';
import { TermChip } from './TermChip';
import styles from './CaptionText.module.css';

export interface CaptionTextProps {
  readonly text: string;
  readonly glossary: CaptionGlossary;
}

const noGlossary: CaptionGlossary = { terms: {}, introduced: [] };

function isFirstUse(segments: readonly CaptionSegment[], index: number, id: TermId): boolean {
  return segments.findIndex((segment) => segment.kind === 'term' && segment.term === id) === index;
}

export function CaptionText({ text, glossary }: CaptionTextProps): ReactElement {
  const segments = parseCaption(text);
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'text') return <Fragment key={index}>{segment.text}</Fragment>;
        if (segment.kind === 'code')
          return (
            <code key={index} className={styles.code}>
              {segment.code}
            </code>
          );
        const term = glossary.terms[segment.term];
        if (term === undefined) return null;
        const isNew =
          glossary.introduced.includes(segment.term) && isFirstUse(segments, index, segment.term);
        return <TermChip key={index} term={term} isNew={isNew} />;
      })}
    </>
  );
}

export function CodeText({ text }: { readonly text: string }): ReactElement {
  return <CaptionText text={text} glossary={noGlossary} />;
}
