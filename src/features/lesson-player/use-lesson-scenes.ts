import { useMemo } from 'react';
import { scenesOf } from '@/domain';
import type { Lesson, LessonKey, Scene } from '@/domain';
import { displayedScene } from './scene-choice';
import { framesOf } from './use-step-playback';

export function useLessonScenes(lesson: Lesson, key: LessonKey): readonly Scene[] {
  return useMemo(() => {
    const result = scenesOf(lesson);
    if (!result.ok) {
      throw new Error(`Lesson "${key}" does not reduce to Scenes: ${result.error.code}`);
    }
    return result.value;
  }, [lesson, key]);
}

export function useStepFrames(
  lesson: Lesson,
  scenes: readonly Scene[],
  step: number,
  gated: boolean,
): readonly Scene[] {
  return useMemo(() => {
    const events = lesson.steps[step]?.events;
    if (gated || events === undefined) return [displayedScene(lesson, scenes, step, gated)];
    const result = framesOf(displayedScene(lesson, scenes, step, true), events);
    if (!result.ok) {
      throw new Error(`Step ${String(step)} does not reduce to frames: ${result.error.code}`);
    }
    return result.value;
  }, [lesson, scenes, step, gated]);
}
