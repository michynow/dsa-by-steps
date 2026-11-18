import { locales, scenesOf } from '@/domain';
import { templateContent } from './_template';
import { lessonMessagesSchema } from './messages-schema';
import { modules } from './registry';
import type { LessonContent } from './types';
import { validateLessonContent } from './validate-lesson';

const registered: readonly LessonContent[] = modules.flatMap((module) => module.lessons);

const checked: readonly LessonContent[] = [templateContent, ...registered];

describe('lessons under test', () => {
  it('are the template plus every registered Lesson', () => {
    expect(checked.map((content) => `${content.module}/${content.lesson.slug}`)).toEqual([
      'template-module/template-lesson',
    ]);
  });

  it('cover every Locale the domain knows', () => {
    expect(Object.keys(templateContent.messages)).toEqual([...locales]);
  });
});

describe.each(
  checked.map((content) => [`${content.module}/${content.lesson.slug}`, content] as const),
)('%s', (_name, content) => {
  it('reduces every Step to a Scene', () => {
    const scenes = scenesOf(content.lesson);
    expect(scenes.ok).toBe(true);
    expect(scenes.ok ? scenes.value.length : -1).toBe(content.lesson.steps.length);
  });

  it.each(locales)('has %s messages matching the schema', (locale) => {
    expect(lessonMessagesSchema.safeParse(content.messages[locale])).toEqual({
      success: true,
      data: content.messages[locale],
    });
  });

  it('has no content issues', () => {
    const scenes = scenesOf(content.lesson);
    expect(scenes.ok ? validateLessonContent(content, scenes.value) : scenes).toEqual([]);
  });
});
