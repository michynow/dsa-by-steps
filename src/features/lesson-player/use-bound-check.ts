import type { LessonContent } from '@/content';
import { lessonKey } from '@/domain';
import type { Locale } from '@/domain';
import { placeholderCheck, placeholderCheckMessages } from './placeholder-check';
import { uncheckedStep } from './step-check';
import type { StepCheckBinding, UseStepCheck } from './step-check';

export function useBoundCheck(
  useStepCheck: UseStepCheck,
  content: LessonContent,
  locale: Locale,
  step: number,
): StepCheckBinding {
  const key = lessonKey(content.module, content.lesson.slug);
  const check = content.lesson.steps[step]?.check;
  const messages = check === undefined ? undefined : content.messages[locale].checks[check.id];
  if (check !== undefined && messages === undefined) {
    throw new Error(`Missing ${locale} messages for Check "${check.id}" in Lesson "${key}"`);
  }
  const binding = useStepCheck(
    key,
    check ?? placeholderCheck,
    messages ?? placeholderCheckMessages,
  );
  return check === undefined ? uncheckedStep : binding;
}
