import { useNavigate } from 'react-router';
import { nextPosition, previousPosition } from '@/domain';
import type { Course, CoursePosition, Locale } from '@/domain';
import type { StepNavigation } from './step-navigation';
import { segmentOf } from './step-route';
import { useArrowNavigation } from './use-arrow-navigation';

interface NavigationInput {
  readonly course: Course;
  readonly locale: Locale;
  readonly position: CoursePosition;
  readonly settled: boolean;
}

function pathOf(course: Course, locale: Locale, position: CoursePosition): string | undefined {
  const lesson = course.modules
    .find((module) => module.slug === position.module)
    ?.lessons.find((candidate) => candidate.slug === position.lesson);
  if (lesson === undefined) return undefined;
  return `/${locale}/${position.module}/${position.lesson}/${segmentOf(lesson, position.step)}`;
}

function pathFrom(
  result: ReturnType<typeof nextPosition>,
  course: Course,
  locale: Locale,
): string | undefined {
  return result.ok && result.value !== null ? pathOf(course, locale, result.value) : undefined;
}

export function useStepNavigation({
  course,
  locale,
  position,
  settled,
}: NavigationInput): StepNavigation {
  const navigate = useNavigate();
  const nextPath = pathFrom(nextPosition(course, position), course, locale);
  const navigation: StepNavigation = {
    previousPath: pathFrom(previousPosition(course, position), course, locale),
    nextPath,
    nextBlocked: !settled && nextPath !== undefined,
    go: (path) => {
      void navigate(path);
    },
  };
  useArrowNavigation(navigation);
  return navigation;
}
