import { checkKey, checkStateOf, lessonKey } from '@/domain';
import type { CoursePosition, Progress } from '@/domain';
import { checkAt, neighboursOf, samePosition } from './step-paths';
import type { NavigationInput } from './use-step-navigation';

function settledAt(input: NavigationInput, progress: Progress, base: CoursePosition): boolean {
  if (samePosition(base, input.position)) return input.settled;
  const check = checkAt(input.course, base);
  if (check === undefined || check.kind === 'order') return true;
  const key = checkKey(lessonKey(base.module, base.lesson), check.id);
  return checkStateOf(progress, key).status !== 'open';
}

export function arrowTarget(
  key: string,
  input: NavigationInput,
  progress: Progress,
  base: CoursePosition,
): CoursePosition | undefined {
  const { previous, next } = neighboursOf(input.course, base);
  if (key === 'ArrowLeft') return previous;
  if (key === 'ArrowRight' && settledAt(input, progress, base)) return next;
  return undefined;
}
