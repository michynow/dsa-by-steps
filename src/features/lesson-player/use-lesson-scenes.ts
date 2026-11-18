import { useMemo } from 'react';
import { scenesOf } from '@/domain';
import type { Lesson, Scene } from '@/domain';

export function useLessonScenes(lesson: Lesson): readonly Scene[] {
  return useMemo(() => {
    const result = scenesOf(lesson);
    return result.ok ? result.value : [];
  }, [lesson]);
}
