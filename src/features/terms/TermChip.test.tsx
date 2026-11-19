import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';
import { createI18n } from '@/features/locale';
import { TermChip } from './TermChip';

const node = { term: 'node', gloss: 'One item of a list.' };
const head = { term: 'head', gloss: 'The first node.' };

function renderChips(locale: 'en' | 'pl', ui: ReactElement) {
  return render(<I18nextProvider i18n={createI18n(locale)}>{ui}</I18nextProvider>);
}

const pair = (
  <>
    <TermChip term={node} isNew={false} />
    <TermChip term={head} isNew={false} />
    <button type="button">elsewhere</button>
  </>
);

describe('TermChip', () => {
  it('is a collapsed button showing the term', () => {
    renderChips('en', <TermChip term={node} isNew={false} />);
    const chip = screen.getByRole('button', { name: 'node' });
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('One item of a list.')).toBeNull();
  });

  it.each([
    [
      'click',
      async (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button')),
    ],
    [
      'Enter',
      async (user: ReturnType<typeof userEvent.setup>) => {
        await user.tab();
        await user.keyboard('{Enter}');
      },
    ],
    [
      'Space',
      async (user: ReturnType<typeof userEvent.setup>) => {
        await user.tab();
        await user.keyboard(' ');
      },
    ],
  ])('opens the popover with the gloss on %s', async (_name, activate) => {
    const user = userEvent.setup();
    renderChips('en', <TermChip term={node} isNew={false} />);
    await activate(user);
    expect(screen.getByRole('button', { name: 'node' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('note').textContent).toBe('node One item of a list.');
  });

  it('shows the gloss of the current Locale', async () => {
    const user = userEvent.setup();
    renderChips('pl', <TermChip term={{ term: 'node', gloss: 'Element listy.' }} isNew={false} />);
    await user.click(screen.getByRole('button', { name: 'node' }));
    expect(screen.getByRole('note').textContent).toBe('node Element listy.');
  });

  it('closes on Escape and returns focus to the chip', async () => {
    const user = userEvent.setup();
    renderChips('en', <TermChip term={node} isNew={false} />);
    const chip = screen.getByRole('button', { name: 'node' });
    await user.click(chip);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('note')).toBeNull();
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(chip);
  });

  it('closes on a second activation', async () => {
    const user = userEvent.setup();
    renderChips('en', <TermChip term={node} isNew={false} />);
    const chip = screen.getByRole('button', { name: 'node' });
    await user.click(chip);
    await user.click(chip);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    renderChips('en', pair);
    await user.click(screen.getByRole('button', { name: 'node' }));
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('keeps only one popover open at a time', async () => {
    const user = userEvent.setup();
    renderChips('en', pair);
    await user.click(screen.getByRole('button', { name: 'node' }));
    await user.click(screen.getByRole('button', { name: 'head' }));
    expect(screen.getAllByRole('note').map((note) => note.textContent)).toEqual([
      'head The first node.',
    ]);
  });

  it('keeps only one popover open when moving by keyboard', async () => {
    const user = userEvent.setup();
    renderChips('en', pair);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getAllByRole('note').map((note) => note.textContent)).toEqual([
      'head The first node.',
    ]);
  });

  it('carries the new marker in the visible text and the accessible name', () => {
    renderChips('en', <TermChip term={node} isNew />);
    expect(screen.getByRole('button', { name: 'node new' }).textContent).toBe('node new');
  });

  it('localises the new marker', () => {
    renderChips('pl', <TermChip term={node} isNew />);
    expect(screen.getByRole('button', { name: 'node nowe' }).textContent).toBe('node nowe');
  });
});
