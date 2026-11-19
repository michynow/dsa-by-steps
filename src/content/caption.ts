import type { StepId } from '@/domain';
import type { LessonContent, LessonMessages, TermId } from './types';

export type CaptionSegment =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'term'; readonly term: TermId };

const termMarker = /\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/;

function appendSegment(
  segments: readonly CaptionSegment[],
  piece: string,
  index: number,
): readonly CaptionSegment[] {
  if (index % 2 === 1) return [...segments, { kind: 'term', term: piece }];
  if (piece === '') return segments;
  const last = segments[segments.length - 1];
  if (last?.kind !== 'text') return [...segments, { kind: 'text', text: piece }];
  return [...segments.slice(0, -1), { kind: 'text', text: last.text + piece }];
}

export function parseCaption(text: string): readonly CaptionSegment[] {
  return text.split(termMarker).reduce(appendSegment, []);
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
