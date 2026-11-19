import { Fragment } from 'react';
import type { ReactElement } from 'react';
import { parseCaption } from '@/content';
import type { CaptionSegment, TermId } from '@/content';
import type { CaptionGlossary } from './introduced-terms';
import { TermChip } from './TermChip';

export interface CaptionTextProps {
  readonly text: string;
  readonly glossary: CaptionGlossary;
}

function isFirstUse(segments: readonly CaptionSegment[], index: number, id: TermId): boolean {
  return segments.findIndex((segment) => segment.kind === 'term' && segment.term === id) === index;
}

export function CaptionText({ text, glossary }: CaptionTextProps): ReactElement {
  const segments = parseCaption(text);
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'text') return <Fragment key={index}>{segment.text}</Fragment>;
        const term = glossary.terms[segment.term];
        if (term === undefined) return null;
        const isNew =
          glossary.introduced.includes(segment.term) && isFirstUse(segments, index, segment.term);
        return <TermChip key={index} term={term} isNew={isNew} />;
      })}
    </>
  );
}
