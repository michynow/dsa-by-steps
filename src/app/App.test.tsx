import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { createI18n } from '@/features/locale';
import { testModules } from '@/test/lesson-fixtures';
import { modules } from '@/content';
import { noStepCheck } from '@/features/lesson-player';
import { createMemoryProgressRepository, createProgressStore } from '@/features/progress';
import { App } from './App';
import { createRoutes } from './routes';

function renderAt(path: string, content = modules) {
  const router = createMemoryRouter(createRoutes({ modules: content, useStepCheck: noStepCheck }), {
    initialEntries: [path],
  });
  const progress = createProgressStore(createMemoryProgressRepository());
  render(<App i18n={createI18n('en')} router={router} progress={progress} />);
  return Object.assign(router, { progress });
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
          .getAllByRole('link', { name: /^(Stacks|Queues|Bare)$/ })
          .map((link) => [link.textContent, link.getAttribute('href')]),
      ).toEqual([
        ['Stacks', '/en/basics/stacks/1'],
        ['Queues', '/en/basics/queues/1'],
        ['Bare', '/en/solo/bare/code'],
      ]);
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
      expect(segments()).toEqual(['Stacksnot passed', 'Queuesnot passed']);
    });

    it('fills the segments of passed Lessons', async () => {
      const router = renderAt('/en/basics/stacks/1', testModules);
      await screen.findByRole('group', { name: 'Module progress' });
      act(() => {
        router.progress.getState().actions.recordSubmit('basics/queues', 'pass');
      });
      expect(segments()).toEqual(['Stacksnot passed', 'Queuespassed']);
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
});
