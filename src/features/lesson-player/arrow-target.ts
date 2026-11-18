import type { CoursePosition } from '@/domain';
import { neighboursOf, samePosition, stepHasCheck } from './step-paths';
import type { NavigationInput } from './use-step-navigation';

function nextAllowed(input: NavigationInput, base: CoursePosition): boolean {
  if (samePosition(base, input.position)) return input.settled;
  return !stepHasCheck(input.course, base);
}

export function arrowTarget(
  key: string,
  input: NavigationInput,
  base: CoursePosition,
): CoursePosition | undefined {
  const { previous, next } = neighboursOf(input.course, base);
  if (key === 'ArrowLeft') return previous;
  if (key === 'ArrowRight' && nextAllowed(input, base)) return next;
  return undefined;
}
