import { exerciseProgressOf, lessonKey } from '../progress';
import type { Progress } from '../progress';
import { err, ok } from '../result';
import type { Result } from '../result';
import type { Course, CourseError, LessonSlug, ModuleSlug } from './types';

export interface ModuleProgress {
  readonly module: ModuleSlug;
  readonly lessons: readonly { readonly lesson: LessonSlug; readonly passed: boolean }[];
  readonly passedCount: number;
  readonly lessonCount: number;
}

export function moduleProgress(
  course: Course,
  module: ModuleSlug,
  progress: Progress,
): Result<ModuleProgress, CourseError> {
  const found = course.modules.find((m) => m.slug === module);
  if (found === undefined) return err({ code: 'unknown-module', module });
  const lessons = found.lessons.map((lesson) => ({
    lesson: lesson.slug,
    passed: exerciseProgressOf(progress, lessonKey(module, lesson.slug)).passed,
  }));
  return ok({
    module,
    lessons,
    passedCount: lessons.filter((l) => l.passed).length,
    lessonCount: lessons.length,
  });
}
