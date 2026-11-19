import type { LessonContent } from '@/content';
import { lessonKey } from '@/domain';
import type { Course, LessonKey, Locale, Scene, Step } from '@/domain';
import type { StepCheckBinding, UseStepCheck } from './step-check';
import { useBoundCheck } from './use-bound-check';
import { useLessonScenes, useStepFrames } from './use-lesson-scenes';
import { useMarkStepSeen } from './use-mark-step-seen';
import { useStepNavigation } from './use-step-navigation';

export interface LessonState {
  readonly key: LessonKey;
  readonly current: Step | undefined;
  readonly binding: StepCheckBinding;
  readonly gated: boolean;
  readonly frames: readonly Scene[];
  readonly navigation: ReturnType<typeof useStepNavigation>;
}

export function useLessonState(
  course: Course,
  content: LessonContent,
  locale: Locale,
  step: number,
  useStepCheck: UseStepCheck,
): LessonState {
  const { lesson } = content;
  const key = lessonKey(content.module, lesson.slug);
  const binding = useBoundCheck(useStepCheck, content, locale, step);
  const current = lesson.steps[step];
  const gated = current?.check !== undefined && !binding.settled;
  const scenes = useLessonScenes(lesson, key);
  const frames = useStepFrames(lesson, scenes, step, gated);
  const navigation = useStepNavigation({
    course,
    locale,
    position: { module: content.module, lesson: lesson.slug, step },
    settled: binding.settled,
  });
  useMarkStepSeen(key, current?.id, binding.settled);
  return { key, current, binding, gated, frames, navigation };
}
