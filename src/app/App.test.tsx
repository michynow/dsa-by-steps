import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { createI18n } from '@/features/locale';
import { testModules } from '@/test/lesson-fixtures';
import { lessonContent, modules, parseCaption } from '@/content';
import type { LessonContent, ModuleContent } from '@/content';
import { noStepCheck } from '@/features/lesson-player';
import type { UseStepCheck } from '@/features/lesson-player';
import { createMemoryProgressRepository, createProgressStore } from '@/features/progress';
import { App } from './App';
import { createRoutes } from './routes';

function renderAt(path: string, content = modules, useStepCheck: UseStepCheck = noStepCheck) {
  const router = createMemoryRouter(createRoutes({ modules: content, useStepCheck }), {
    initialEntries: [path],
  });
  const progress = createProgressStore(createMemoryProgressRepository());
  render(<App i18n={createI18n('en')} router={router} progress={progress} />);
  return Object.assign(router, { progress });
}

function renderWithDefaultChecks(path: string, content: readonly ModuleContent[] = modules) {
  const router = createMemoryRouter(createRoutes({ modules: content }), { initialEntries: [path] });
  const progress = createProgressStore(createMemoryProgressRepository());
  render(<App i18n={createI18n('en')} router={router} progress={progress} />);
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the Course home in the Locale from the URL', async () => {
    renderAt('/pl');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'DSA krok po kroku' }),
    ).toBeVisible();
    expect(document.documentElement.lang).toBe('pl');
  });

  it('redirects the root to the browser Locale', async () => {
    const router = renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'DSA by steps' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/en');
  });

  it('redirects an unknown Locale', async () => {
    const router = renderAt('/de');
    await screen.findByRole('heading', { level: 1 });
    expect(router.state.location.pathname).toBe('/en');
  });

  it('switches Locale, keeps the path and remembers the choice', async () => {
    const user = userEvent.setup();
    const router = renderAt('/en');
    await user.click(await screen.findByRole('button', { name: 'Polski' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'DSA krok po kroku' }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/pl');
    expect(screen.getByRole('button', { name: 'Polski' })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('dsa-by-steps.locale')).toBe('pl');
  });

  describe('Course home', () => {
    it('lists each Module with its Lessons as links to Step 1', async () => {
      renderAt('/en', testModules);
      await screen.findByRole('heading', { level: 1 });
      expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
        'Basics',
        'Empty module',
        'Solo',
      ]);
      expect(
        screen
          .getAllByRole('link', { name: /^(Stacks|Queues)$/ })
          .map((link) => [link.textContent, link.getAttribute('href')]),
      ).toEqual([
        ['Stacks', '/en/basics/stacks/1'],
        ['Queues', '/en/basics/queues/1'],
      ]);
      expect(screen.getByText('Bare')).toBeVisible();
      expect(screen.getByText('No steps yet')).toBeVisible();
      expect(screen.queryByRole('link', { name: /Bare/ })).toBeNull();
    });

    it('shows a Module without Lessons as a heading with no list', async () => {
      renderAt('/en', testModules);
      const section = (await screen.findByRole('heading', { name: 'Empty module' })).closest(
        'section',
      );
      expect(section && within(section).queryByRole('list')).toBeNull();
    });

    it('lists Modules and Lessons in the current Locale', async () => {
      renderAt('/pl', testModules);
      expect(await screen.findByRole('heading', { level: 2, name: 'Podstawy' })).toBeVisible();
      expect(screen.getByRole('link', { name: 'PL Stacks' })).toHaveAttribute(
        'href',
        '/pl/basics/stacks/1',
      );
    });

    it('opens a Lesson from the list', async () => {
      const user = userEvent.setup();
      const router = renderAt('/en', testModules);
      await user.click(await screen.findByRole('link', { name: 'Queues' }));
      expect(router.state.location.pathname).toBe('/en/basics/queues/1');
      expect(await screen.findByRole('heading', { level: 1, name: 'Queues' })).toBeVisible();
    });
  });

  describe('Module progress bar', () => {
    const segments = () =>
      within(screen.getByRole('group', { name: 'Module progress' }))
        .getAllByRole('listitem')
        .map((item) => item.textContent);

    it('shows the Module, Lesson position and a segment per Lesson on Lesson pages', async () => {
      renderAt('/en/basics/queues/1', testModules);
      const bar = await screen.findByRole('group', { name: 'Module progress' });
      expect(within(bar).getByText('Basics')).toBeVisible();
      expect(within(bar).getByText('Lesson 2 of 2')).toBeVisible();
      expect(segments()).toEqual(['Stacks, not passed', 'Queues, not passed']);
    });

    it('fills the segments of passed Lessons', async () => {
      const router = renderAt('/en/basics/stacks/1', testModules);
      await screen.findByRole('group', { name: 'Module progress' });
      act(() => {
        router.progress.getState().actions.recordSubmit('basics/queues', 'pass');
      });
      expect(segments()).toEqual(['Stacks, not passed', 'Queues, passed']);
    });

    it('is absent from the Course home', async () => {
      renderAt('/en', testModules);
      await screen.findByRole('heading', { level: 1 });
      expect(screen.queryByRole('group', { name: 'Module progress' })).toBeNull();
    });
  });

  it('redirects an unknown Lesson step to the Course home', async () => {
    const router = renderAt('/en/basics/nope/1', testModules);
    await screen.findByRole('heading', { level: 1 });
    expect(router.state.location.pathname).toBe('/en');
  });

  it('shows an error message inside the Shell when Lesson content is broken', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const [basics] = testModules;
    const stacks = basics?.lessons[0];
    if (!basics || !stacks) throw new Error('fixture');
    const broken = [
      {
        ...basics,
        lessons: [
          {
            ...stacks,
            messages: { ...stacks.messages, en: { ...stacks.messages.en, checks: {} } },
          },
        ],
      },
    ];
    renderAt('/en/basics/stacks/2', broken);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This Lesson cannot be shown.Its content is broken. Please report it.',
    );
    expect(screen.getByRole('link', { name: 'Course home' })).toBeVisible();
    vi.restoreAllMocks();
  });

  describe('Checks in the Lesson player', () => {
    const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    function visibleText(raw: string): RegExp {
      const longest = parseCaption(raw)
        .flatMap((segment) => (segment.kind === 'text' ? [segment.text.trim()] : []))
        .reduce((best, text) => (text.length > best.length ? text : best), '');
      return new RegExp(escaped(longest));
    }

    function gatedStepOf(content: LessonContent) {
      const index = content.lesson.steps.findIndex((step) => step.check?.kind === 'choice');
      const step = content.lesson.steps[index];
      const check = step?.check;
      if (step === undefined || check?.kind !== 'choice') throw new Error('no Choice Check');
      const messages = content.messages.en;
      const checkMessages = messages.checks[check.id];
      const label = (option: string) => checkMessages?.options?.[option] ?? '';
      const wrong = check.options.find((option) => option !== check.correct) ?? '';
      return {
        path: `/en/${content.module}/${content.lesson.slug}/${String(index + 1)}`,
        wrongOption: label(wrong),
        caption: visibleText(messages.steps[step.id]?.caption ?? ''),
        explanation: visibleText(checkMessages?.explanation ?? ''),
      };
    }

    function replacing(content: LessonContent): readonly ModuleContent[] {
      const existing = modules.some((module) => module.slug === content.module);
      const base = existing ? modules : testModules;
      return base.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) =>
          lesson.lesson.slug === content.lesson.slug ? content : lesson,
        ),
      }));
    }

    async function gatesAndReveals(content: LessonContent) {
      const { path, wrongOption, caption, explanation } = gatedStepOf(content);
      const user = userEvent.setup();
      renderWithDefaultChecks(path, replacing(content));
      await screen.findByRole('radiogroup');
      expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('aria-disabled', 'true');
      expect(screen.queryByText(caption)).toBeNull();
      expect(screen.queryByRole('button', { name: 'Show me' })).toBeNull();
      for (let miss = 0; miss < 3; miss += 1) {
        await user.click(screen.getByRole('radio', { name: wrongOption }));
        await user.click(screen.getByRole('button', { name: 'Check answer' }));
        expect(screen.getByRole('status')).toHaveTextContent('Not right. Try again.');
      }
      await user.click(screen.getByRole('button', { name: 'Show me' }));
      expect(screen.getByRole('button', { name: 'Next' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(screen.getByText(caption)).toBeVisible();
      expect(screen.getByText(explanation)).toBeVisible();
    }

    it('gates the first Choice Step of Linked lists, counts Misses and unblocks next on Reveal', async () => {
      const content = lessonContent('foundations', 'linked-lists');
      if (content === undefined) throw new Error('missing Lesson');
      await gatesAndReveals(content);
    });

    it('does the same when the first Choice Check sits on Step 3', async () => {
      const stacks = testModules[0]?.lessons[0];
      if (stacks === undefined) throw new Error('fixture');
      const [why, push, pop] = stacks.lesson.steps;
      if (why === undefined || push === undefined || pop === undefined) throw new Error('fixture');
      const content = { ...stacks, lesson: { ...stacks.lesson, steps: [why, pop, push] } };
      expect(gatedStepOf(content).path).toBe('/en/basics/stacks/3');
      await gatesAndReveals(content);
    });
  });
});
