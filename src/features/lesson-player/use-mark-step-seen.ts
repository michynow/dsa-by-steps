import { useEffect } from 'react';
import type { LessonKey } from '@/domain';
import { useProgressActions } from '@/features/progress';

export function useMarkStepSeen(
  lesson: LessonKey,
  step: string | undefined,
  settled: boolean,
): void {
  const actions = useProgressActions();
  useEffect(() => {
    if (step !== undefined && settled) actions.markStepSeen(lesson, step);
  }, [actions, lesson, step, settled]);
}
