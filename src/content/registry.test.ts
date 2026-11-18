import type { Course } from '@/domain';
import { templateContent } from './_template';
import { course, courseOf, lessonContent, moduleContent, modules } from './registry';
import type { ModuleContent } from './types';

function moduleWith(slug: string, lessonSlugs: readonly string[]): ModuleContent {
  return {
    slug,
    titles: { en: slug, pl: slug },
    lessons: lessonSlugs.map((lessonSlug) => ({
      ...templateContent,
      module: slug,
      lesson: { ...templateContent.lesson, slug: lessonSlug },
    })),
  };
}

describe('registry', () => {
  it('lists Foundations first', () => {
    expect(modules.map((module) => module.slug)).toEqual(['foundations']);
  });

  it('derives the course from the modules', () => {
    expect(course).toEqual({ modules: [{ slug: 'foundations', lessons: [] }] });
  });

  it('preserves Module and Lesson order when deriving a course', () => {
    const derived = courseOf([
      moduleWith('zeta', ['b-lesson', 'a-lesson']),
      moduleWith('alpha', ['only-lesson']),
    ]);
    const expected: Course = {
      modules: [
        {
          slug: 'zeta',
          lessons: [
            { ...templateContent.lesson, slug: 'b-lesson' },
            { ...templateContent.lesson, slug: 'a-lesson' },
          ],
        },
        { slug: 'alpha', lessons: [{ ...templateContent.lesson, slug: 'only-lesson' }] },
      ],
    };
    expect(derived).toEqual(expected);
  });

  it('finds a registered Module', () => {
    expect(moduleContent('foundations')).toEqual(modules[0]);
  });

  it('returns undefined for an unknown Module', () => {
    expect(moduleContent('no-such-module')).toBeUndefined();
    expect(lessonContent('no-such-module', 'linked-lists')).toBeUndefined();
  });

  it('returns undefined for an unknown Lesson in a known Module', () => {
    expect(lessonContent('foundations', 'no-such-lesson')).toBeUndefined();
  });
});
