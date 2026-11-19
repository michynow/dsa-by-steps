import type { StepId } from '@/domain';
import type { LessonContent, LessonMessages, TermId } from './types';

export type CaptionSegment =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'term'; readonly term: TermId };

const termMarker = /\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/;

function segmentOf(piece: string, index: number): readonly CaptionSegment[] {
  if (index % 2 === 1) return [{ kind: 'term', term: piece }];
  return piece === '' ? [] : [{ kind: 'text', text: piece }];
}

export function parseCaption(text: string): readonly CaptionSegment[] {
  return text.split(termMarker).flatMap(segmentOf);
}

const anyMarker = /\[\[.*?\]\]/g;

export function hasMarker(text: string): boolean {
  return text.search(anyMarker) !== -1;
}

export function malformedMarkers(text: string): readonly string[] {
  return (text.match(anyMarker) ?? []).filter((marker) => !termMarker.test(marker));
}

export function termsMarkedIn(text: string | undefined): readonly TermId[] {
  return parseCaption(text ?? '').flatMap((segment) =>
    segment.kind === 'term' ? [segment.term] : [],
  );
}

export function stepTerms(messages: LessonMessages, step: StepId): readonly TermId[] {
  const own = messages.steps[step];
  return [...termsMarkedIn(own?.caption), ...termsMarkedIn(own?.keyIdea)];
}

export function termIntroductions(content: LessonContent): Readonly<Record<TermId, StepId>> {
  const { steps } = content.lesson;
  return Object.fromEntries(
    content.terms.flatMap((term): readonly [TermId, StepId][] => {
      const step = steps.find((candidate) =>
        stepTerms(content.messages.en, candidate.id).includes(term),
      );
      return step === undefined ? [] : [[term, step.id]];
    }),
  );
}
