import { useNavigate } from 'react-router';
import type { Course, CoursePosition, Locale } from '@/domain';
import type { StepNavigation } from './step-navigation';
import { neighboursOf, pathOf } from './step-paths';
import { useArrowNavigation } from './use-arrow-navigation';

export interface NavigationInput {
  readonly course: Course;
  readonly locale: Locale;
  readonly position: CoursePosition;
  readonly settled: boolean;
}

export function useStepNavigation(input: NavigationInput): StepNavigation {
  const navigate = useNavigate();
  const { course, locale, position, settled } = input;
  const { previous, next } = neighboursOf(course, position);
  const nextPath = next === undefined ? undefined : pathOf(course, locale, next);
  const go = (path: string): void => {
    void navigate(path);
  };
  useArrowNavigation(input, go);
  return {
    previousPath: previous === undefined ? undefined : pathOf(course, locale, previous),
    nextPath,
    nextBlocked: !settled && nextPath !== undefined,
    go,
  };
}
