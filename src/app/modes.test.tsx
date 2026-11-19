import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { createI18n } from '@/features/locale';
import { noStepCheck } from '@/features/lesson-player';
import { createMemoryProgressRepository, createProgressStore } from '@/features/progress';
import { testModules } from '@/test/lesson-fixtures';
import { App } from './App';
import { createRoutes } from './routes';

function renderAt(path: string, locale: 'en' | 'pl' = 'en') {
  const router = createMemoryRouter(
    createRoutes({ modules: testModules, useStepCheck: noStepCheck }),
    { initialEntries: [path] },
  );
  const progress = createProgressStore(createMemoryProgressRepository());
  render(<App i18n={createI18n(locale)} router={router} progress={progress} />);
  return router;
}

const modeSwitch = () => screen.getByRole('navigation', { name: 'Mode' });

describe('mode switch', () => {
  it('links Learn to the Course home and Practice to the Practice page', async () => {
    renderAt('/en');
    const switcher = await screen.findByRole('navigation', { name: 'Mode' });
    expect(
      within(switcher)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href'), link.ariaCurrent]),
    ).toEqual([
      ['Learn', '/en', 'page'],
      ['Practice', '/en/practice', null],
    ]);
  });

  it('marks Practice current on the Practice page', async () => {
    renderAt('/en/practice');
    await screen.findByRole('heading', { level: 1, name: 'Practice' });
    expect(
      within(modeSwitch())
        .getAllByRole('link')
        .map((link) => [link.textContent, link.ariaCurrent]),
    ).toEqual([
      ['Learn', null],
      ['Practice', 'page'],
    ]);
  });

  it('marks Practice current on a Practice detail and Learn on a Lesson', async () => {
    renderAt('/en/practice/basics/stacks');
    await screen.findByRole('heading', { level: 1, name: 'Stacks' });
    expect(within(modeSwitch()).getByRole('link', { name: 'Practice' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('marks Learn current on a Lesson page', async () => {
    renderAt('/en/basics/stacks/1');
    await screen.findByRole('heading', { level: 1, name: 'Stacks' });
    expect(
      within(modeSwitch())
        .getAllByRole('link')
        .map((link) => [link.textContent, link.ariaCurrent]),
    ).toEqual([
      ['Learn', 'page'],
      ['Practice', null],
    ]);
  });

  it('switches mode and keeps the Locale', async () => {
    const user = userEvent.setup();
    const router = renderAt('/pl/basics/stacks/1', 'pl');
    await user.click(await screen.findByRole('link', { name: 'Ćwicz' }));
    expect(router.state.location.pathname).toBe('/pl/practice');
    await user.click(screen.getByRole('link', { name: 'Ucz się' }));
    expect(router.state.location.pathname).toBe('/pl');
  });
});

describe('Practice page', () => {
  it('lists each Module with one Exercise card per Lesson', async () => {
    renderAt('/en/practice');
    await screen.findByRole('heading', { level: 1, name: 'Practice' });
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Basics',
      'Empty module',
      'Solo',
    ]);
    expect(
      screen
        .getAllByRole('link', { name: /Coming soon$/ })
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Stacks Coming soon', '/en/practice/basics/stacks'],
      ['Queues Coming soon', '/en/practice/basics/queues'],
      ['Bare Coming soon', '/en/practice/solo/bare'],
    ]);
  });

  it('shows the detail of an Exercise with a link back to its Lesson', async () => {
    renderAt('/en/practice/basics/queues');
    expect(await screen.findByRole('heading', { level: 1, name: 'Queues' })).toBeVisible();
    expect(screen.getByText('Coming soon')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to the Lesson' })).toHaveAttribute(
      'href',
      '/en/basics/queues',
    );
  });

  it.each(['/en/practice/nope/stacks', '/en/practice/basics/nope', '/en/practice/nope'])(
    'redirects %s to the Practice page',
    async (path) => {
      const router = renderAt(path);
      await screen.findByRole('heading', { level: 1, name: 'Practice' });
      expect(router.state.location.pathname).toBe('/en/practice');
    },
  );

  it('opens a detail from its card', async () => {
    const user = userEvent.setup();
    const router = renderAt('/en/practice');
    await user.click(await screen.findByRole('link', { name: /^Stacks/ }));
    expect(router.state.location.pathname).toBe('/en/practice/basics/stacks');
  });
});

describe('legacy Exercise URLs', () => {
  it('redirects /code to the Practice detail and keeps the Locale', async () => {
    const router = renderAt('/pl/basics/stacks/code', 'pl');
    await screen.findByRole('heading', { level: 1, name: 'PL Stacks' });
    expect(router.state.location.pathname).toBe('/pl/practice/basics/stacks');
  });

  it('redirects an unknown Lesson /code to the Practice page', async () => {
    const router = renderAt('/en/basics/nope/code');
    await screen.findByRole('heading', { level: 1, name: 'Practice' });
    expect(router.state.location.pathname).toBe('/en/practice');
  });
});
