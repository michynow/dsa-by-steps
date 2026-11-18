import { nextPosition, previousPosition } from '@/domain';
import type { Check, Course, CoursePosition, Locale } from '@/domain';
import { segmentOf, stepIndexOf } from './step-route';

export interface Neighbours {
  readonly previous: CoursePosition | undefined;
  readonly next: CoursePosition | undefined;
}

export function pathOf(
  course: Course,
  locale: Locale,
  position: CoursePosition,
): string | undefined {
  const lesson = course.modules
    .find((module) => module.slug === position.module)
    ?.lessons.find((candidate) => candidate.slug === position.lesson);
  if (lesson === undefined) return undefined;
  return `/${locale}/${position.module}/${position.lesson}/${segmentOf(lesson, position.step)}`;
}

function found(result: ReturnType<typeof nextPosition>): CoursePosition | undefined {
  return result.ok ? (result.value ?? undefined) : undefined;
}

export function neighboursOf(course: Course, position: CoursePosition): Neighbours {
  return {
    previous: found(previousPosition(course, position)),
    next: found(nextPosition(course, position)),
  };
}

export function checkAt(course: Course, position: CoursePosition): Check | undefined {
  const lesson = course.modules
    .find((module) => module.slug === position.module)
    ?.lessons.find((candidate) => candidate.slug === position.lesson);
  return lesson?.steps[position.step]?.check;
}

export function samePosition(a: CoursePosition, b: CoursePosition): boolean {
  return a.module === b.module && a.lesson === b.lesson && a.step === b.step;
}

export function positionOfPath(course: Course, pathname: string): CoursePosition | undefined {
  const [, , module, lessonSlug, segment] = pathname.split('/');
  const lesson = course.modules
    .find((candidate) => candidate.slug === module)
    ?.lessons.find((candidate) => candidate.slug === lessonSlug);
  const step = lesson && stepIndexOf(segment, lesson);
  if (module === undefined || lessonSlug === undefined || step === undefined) return undefined;
  return { module, lesson: lessonSlug, step };
}
