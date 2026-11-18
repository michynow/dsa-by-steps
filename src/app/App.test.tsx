import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { createI18n } from '@/features/locale';
import { App } from './App';
import { routes } from './routes';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<App i18n={createI18n('en')} router={router} />);
  return router;
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
});
