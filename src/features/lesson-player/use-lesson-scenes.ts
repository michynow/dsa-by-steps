import { useMemo } from 'react';
import { scenesOf } from '@/domain';
import type { Lesson, LessonKey, Scene } from '@/domain';

export function useLessonScenes(lesson: Lesson, key: LessonKey): readonly Scene[] {
  return useMemo(() => {
    const result = scenesOf(lesson);
    if (!result.ok) {
      throw new Error(`Lesson "${key}" does not reduce to Scenes: ${result.error.code}`);
    }
    return result.value;
  }, [lesson, key]);
}
