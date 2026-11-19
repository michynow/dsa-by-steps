import { parseCaption, termIntroductions } from '@/content';
import type { LessonContent, TermId, TermMessages } from '@/content';
import type { Locale } from '@/domain';

export function termsIntroducedBy(content: LessonContent, step: number): readonly TermId[] {
  const introductions = termIntroductions(content);
  const order = content.lesson.steps.map((candidate) => candidate.id);
  return content.terms.filter((term) => {
    const at = introductions[term];
    return at !== undefined && order.indexOf(at) <= step;
  });
}

export function termsIntroducedAt(content: LessonContent, step: number): readonly TermId[] {
  const introductions = termIntroductions(content);
  const id = content.lesson.steps[step]?.id;
  return content.terms.filter((term) => id !== undefined && introductions[term] === id);
}

export interface CaptionGlossary {
  readonly terms: Readonly<Record<TermId, TermMessages>>;
  readonly introduced: readonly TermId[];
}

export function captionGlossary(
  content: LessonContent,
  locale: Locale,
  step: number,
): CaptionGlossary {
  return { terms: content.messages[locale].terms, introduced: termsIntroducedAt(content, step) };
}

export function afterCaption(glossary: CaptionGlossary, caption: string): CaptionGlossary {
  const used = parseCaption(caption).flatMap((segment) =>
    segment.kind === 'term' ? [segment.term] : [],
  );
  return { ...glossary, introduced: glossary.introduced.filter((term) => !used.includes(term)) };
}
