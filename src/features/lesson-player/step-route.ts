import type { Lesson } from '@/domain';

export function stepIndexOf(segment: string | undefined, lesson: Lesson): number | undefined {
  if (segment === undefined || !/^[1-9]\d*$/.test(segment)) return undefined;
  const index = Number(segment) - 1;
  return index < lesson.steps.length ? index : undefined;
}

export function segmentOf(step: number): string {
  return String(step + 1);
}
