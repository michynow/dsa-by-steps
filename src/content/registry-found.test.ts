import { templateContent } from './_template';
import { course, lessonContent, moduleContent, modules } from './registry';

vi.mock('./foundations', async () => {
  const { templateContent: lesson } = await import('./_template');
  return {
    foundations: {
      slug: 'foundations',
      titles: { en: 'Foundations', pl: 'Podstawy' },
      lessons: [lesson],
    },
  };
});

describe('registry with a registered Lesson', () => {
  it('returns the registered Module', () => {
    expect(moduleContent('foundations')).toEqual(modules[0]);
    expect(modules[0]?.lessons).toEqual([templateContent]);
  });

  it('returns the registered Lesson', () => {
    expect(lessonContent('foundations', 'template-lesson')).toEqual(templateContent);
  });

  it('returns undefined for another Lesson slug', () => {
    expect(lessonContent('foundations', 'other')).toBeUndefined();
  });

  it('derives the course from the registered Lesson', () => {
    expect(course).toEqual({
      modules: [{ slug: 'foundations', lessons: [templateContent.lesson] }],
    });
  });
});
