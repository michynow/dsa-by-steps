import { err, ok } from '../result';
import type { Result } from '../result';
import type { Course, CourseError, CoursePosition, Lesson, Module } from './types';

export interface LocatedPosition {
  readonly module: Module;
  readonly lesson: Lesson;
  readonly moduleIndex: number;
  readonly lessonIndex: number;
  readonly step: number;
  readonly isExercise: boolean;
}

interface LessonRef {
  readonly module: string;
  readonly lesson: Lesson;
}

function isStepIndex(step: number, stepCount: number): boolean {
  return Number.isInteger(step) && step >= 0 && step <= stepCount;
}

export function locate(
  course: Course,
  position: CoursePosition,
): Result<LocatedPosition, CourseError> {
  const moduleIndex = course.modules.findIndex((m) => m.slug === position.module);
  const module = course.modules[moduleIndex];
  if (module === undefined) return err({ code: 'unknown-module', module: position.module });
  const lessonIndex = module.lessons.findIndex((l) => l.slug === position.lesson);
  const lesson = module.lessons[lessonIndex];
  if (lesson === undefined) {
    return err({ code: 'unknown-lesson', module: position.module, lesson: position.lesson });
  }
  const stepCount = lesson.steps.length;
  if (!isStepIndex(position.step, stepCount)) {
    return err({
      code: 'step-out-of-range',
      module: position.module,
      lesson: position.lesson,
      step: position.step,
      stepCount,
    });
  }
  return ok({
    module,
    lesson,
    moduleIndex,
    lessonIndex,
    step: position.step,
    isExercise: position.step === stepCount,
  });
}

function lessonsInOrder(course: Course): readonly LessonRef[] {
  return course.modules.flatMap((m) => m.lessons.map((lesson) => ({ module: m.slug, lesson })));
}

function indexOfLesson(lessons: readonly LessonRef[], located: LocatedPosition): number {
  return lessons.findIndex(
    (ref) => ref.module === located.module.slug && ref.lesson.slug === located.lesson.slug,
  );
}

function startOf(ref: LessonRef | undefined): CoursePosition | null {
  return ref === undefined ? null : { module: ref.module, lesson: ref.lesson.slug, step: 0 };
}

function endOf(ref: LessonRef | undefined): CoursePosition | null {
  return ref === undefined
    ? null
    : { module: ref.module, lesson: ref.lesson.slug, step: ref.lesson.steps.length };
}

export function firstPosition(course: Course): CoursePosition | null {
  return startOf(lessonsInOrder(course)[0]);
}

export function nextPosition(
  course: Course,
  position: CoursePosition,
): Result<CoursePosition | null, CourseError> {
  const located = locate(course, position);
  if (!located.ok) return located;
  if (!located.value.isExercise) return ok({ ...position, step: position.step + 1 });
  const lessons = lessonsInOrder(course);
  return ok(startOf(lessons[indexOfLesson(lessons, located.value) + 1]));
}

export function previousPosition(
  course: Course,
  position: CoursePosition,
): Result<CoursePosition | null, CourseError> {
  const located = locate(course, position);
  if (!located.ok) return located;
  if (position.step > 0) return ok({ ...position, step: position.step - 1 });
  const lessons = lessonsInOrder(course);
  return ok(endOf(lessons[indexOfLesson(lessons, located.value) - 1]));
}
