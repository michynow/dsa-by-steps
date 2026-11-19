import type { LessonContent, ModuleContent } from '@/content';

export function findLesson(
  modules: readonly ModuleContent[],
  module: string,
  lesson: string,
): LessonContent | undefined {
  return modules
    .find((candidate) => candidate.slug === module)
    ?.lessons.find((candidate) => candidate.lesson.slug === lesson);
}
