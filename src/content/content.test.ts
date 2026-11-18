import { applyStepEvents, locales, scenesOf } from '@/domain';
import type { Scene } from '@/domain';
import { templateContent } from './_template';
import foundationsEn from './foundations/en.json';
import foundationsPl from './foundations/pl.json';
import { lessonMessagesSchema } from './messages-schema';
import { modules } from './registry';
import type { LessonContent } from './types';
import { validateLessonContent } from './validate-lesson';

function keyOf(content: LessonContent): string {
  return `${content.module}/${content.lesson.slug}`;
}

const registered: readonly LessonContent[] = modules.flatMap((module) => module.lessons);

const checked: readonly LessonContent[] = [templateContent, ...registered];

function expectedScenes(content: LessonContent): readonly Scene[] {
  const scenes: Scene[] = [];
  let current = content.lesson.initialScene;
  for (const step of content.lesson.steps) {
    const next = applyStepEvents(current, step.events);
    if (!next.ok) throw new Error(`${keyOf(content)} step ${step.id}: ${next.error.code}`);
    scenes.push(next.value);
    current = next.value;
  }
  return scenes;
}

describe('lessons under test', () => {
  it('are the template followed by every registered Lesson', () => {
    expect(checked.map(keyOf)).toEqual([
      'template-module/template-lesson',
      ...registered.map(keyOf),
    ]);
    expect(checked[0]).toBe(templateContent);
  });

  it('define messages for exactly the domain Locales', () => {
    expect(checked.map((content) => Object.keys(content.messages))).toEqual(
      checked.map(() => [...locales]),
    );
  });
});

describe('Module titles', () => {
  it('come from the per-Locale files', () => {
    expect(modules[0]?.titles).toEqual({ en: foundationsEn.title, pl: foundationsPl.title });
  });

  it.each(modules.flatMap((module) => locales.map((locale) => [module.slug, locale] as const)))(
    '%s has a non-empty %s title',
    (slug, locale) => {
      const title = modules.find((module) => module.slug === slug)?.titles[locale];
      expect(title).toMatch(/\S/);
    },
  );
});

describe.each(checked.map((content) => [keyOf(content), content] as const))(
  '%s',
  (_name, content) => {
    it('reduces every Step to a Scene', () => {
      expect(scenesOf(content.lesson)).toEqual({ ok: true, value: expectedScenes(content) });
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
  },
);

describe('validateLessonContent Locale coverage', () => {
  it.each(locales)('reports a missing title in %s', (locale) => {
    const messages = {
      ...templateContent.messages,
      [locale]: {
        ...templateContent.messages[locale],
        title: undefined,
      },
    };
    const scenes = scenesOf(templateContent.lesson);
    const issues = scenes.ok
      ? validateLessonContent({ ...templateContent, messages }, scenes.value)
      : [];
    expect(issues).toContainEqual({ code: 'missing-message-key', locale, path: 'title' });
  });
});
