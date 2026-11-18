import type { Lesson } from '@/domain';

export const exerciseSegment = 'code';

export function stepIndexOf(segment: string | undefined, lesson: Lesson): number | undefined {
  if (segment === exerciseSegment) return lesson.steps.length;
  if (segment === undefined || !/^[1-9]\d*$/.test(segment)) return undefined;
  const index = Number(segment) - 1;
  return index < lesson.steps.length ? index : undefined;
}

export function segmentOf(lesson: Lesson, step: number): string {
  return step >= lesson.steps.length ? exerciseSegment : String(step + 1);
}
