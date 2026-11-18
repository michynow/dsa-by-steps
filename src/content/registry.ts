import type { Course, LessonSlug, ModuleSlug } from '@/domain';
import { foundations } from './foundations';
import type { LessonContent, ModuleContent } from './types';

export const modules: readonly ModuleContent[] = [foundations];

export function courseOf(content: readonly ModuleContent[]): Course {
  return {
    modules: content.map((module) => ({
      slug: module.slug,
      lessons: module.lessons.map((lesson) => lesson.lesson),
    })),
  };
}

export const course: Course = courseOf(modules);

export function moduleContent(module: ModuleSlug): ModuleContent | undefined {
  return modules.find((candidate) => candidate.slug === module);
}

export function lessonContent(module: ModuleSlug, lesson: LessonSlug): LessonContent | undefined {
  return moduleContent(module)?.lessons.find((candidate) => candidate.lesson.slug === lesson);
}
