import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import type { ReactElement } from 'react';
import { createI18n } from '@/features/locale';
import { TermChip } from './TermChip';

const node = { term: 'node', gloss: 'One item of a list.' };
const head = { term: 'head', gloss: 'The first node.' };

type User = ReturnType<typeof userEvent.setup>;

function renderChips(locale: 'en' | 'pl', ui: ReactElement) {
  return render(<I18nextProvider i18n={createI18n(locale)}>{ui}</I18nextProvider>);
}

function popoverOf(chip: HTMLElement): HTMLElement | null {
  const id = chip.getAttribute('aria-controls');
  return id === null ? null : document.getElementById(id);
}

const openPopovers = () =>
  screen
    .getAllByRole('button', { expanded: true })
    .map((chip) => popoverOf(chip)?.textContent ?? null);

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
    expect(chip.getAttribute('aria-controls')).toBeNull();
    expect(screen.queryByText('One item of a list.')).toBeNull();
  });

  it.each([
    ['click', async (user: User) => user.click(screen.getByRole('button'))],
    [
      'Enter',
      async (user: User) => {
        await user.tab();
        await user.keyboard('{Enter}');
      },
    ],
    [
      'Space',
      async (user: User) => {
        await user.tab();
        await user.keyboard(' ');
      },
    ],
  ])('opens the popover with the gloss on %s', async (_name, activate) => {
    const user = userEvent.setup();
    renderChips('en', <TermChip term={node} isNew={false} />);
    await activate(user);
    const chip = screen.getByRole('button', { name: 'node' });
    expect(chip.getAttribute('aria-expanded')).toBe('true');
    expect(popoverOf(chip)?.textContent).toBe('node One item of a list.');
  });

  it('links the popover to the chip by id and announces it as the description', async () => {
    const user = userEvent.setup();
    renderChips('en', <TermChip term={node} isNew={false} />);
    const chip = screen.getByRole('button', { name: 'node' });
    await user.click(chip);
    const popover = popoverOf(chip);
    expect(popover?.id).toBe(chip.getAttribute('aria-controls'));
    expect(chip.getAttribute('aria-describedby')).toBe(popover?.id);
    expect(chip).toHaveAccessibleDescription('node One item of a list.');
  });

  it('gives every popover its own id', async () => {
    const user = userEvent.setup();
    renderChips('en', pair);
    await user.click(screen.getByRole('button', { name: 'node' }));
    const first = screen.getByRole('button', { name: 'node' }).getAttribute('aria-controls');
    await user.click(screen.getByRole('button', { name: 'head' }));
    const second = screen.getByRole('button', { name: 'head' }).getAttribute('aria-controls');
    expect(first === second).toBe(false);
  });

  it('shows the gloss of the current Locale', async () => {
    const user = userEvent.setup();
    renderChips('pl', <TermChip term={{ term: 'node', gloss: 'Element listy.' }} isNew={false} />);
    const chip = screen.getByRole('button', { name: 'node' });
    await user.click(chip);
    expect(popoverOf(chip)?.textContent).toBe('node Element listy.');
  });

  it('closes on Escape and returns focus to the chip', async () => {
    const user = userEvent.setup();
    renderChips('en', <TermChip term={node} isNew={false} />);
    const chip = screen.getByRole('button', { name: 'node' });
    await user.click(chip);
    await user.keyboard('{Escape}');
    expect(popoverOf(chip)).toBeNull();
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(chip);
  });

  it('closes on a second activation', async () => {
    const user = userEvent.setup();
    renderChips('en', <TermChip term={node} isNew={false} />);
    const chip = screen.getByRole('button', { name: 'node' });
    await user.click(chip);
    await user.click(chip);
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('One item of a list.')).toBeNull();
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    renderChips('en', pair);
    await user.click(screen.getByRole('button', { name: 'node' }));
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.queryByText('One item of a list.')).toBeNull();
  });

  it('keeps only one popover open at a time', async () => {
    const user = userEvent.setup();
    renderChips('en', pair);
    await user.click(screen.getByRole('button', { name: 'node' }));
    await user.click(screen.getByRole('button', { name: 'head' }));
    expect(openPopovers()).toEqual(['head The first node.']);
  });

  it('keeps only one popover open when moving by keyboard', async () => {
    const user = userEvent.setup();
    renderChips('en', pair);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.keyboard('{Enter}');
    expect(openPopovers()).toEqual(['head The first node.']);
  });

  it('keeps the new marker out of the accessible name and exposes it as the description', () => {
    renderChips('en', <TermChip term={node} isNew />);
    const chip = screen.getByRole('button', { name: 'node' });
    expect(chip).toHaveAccessibleDescription('New term');
    expect(chip.textContent).toBe('node new');
  });

  it('localises the new marker description', () => {
    renderChips('pl', <TermChip term={node} isNew />);
    expect(screen.getByRole('button', { name: 'node' })).toHaveAccessibleDescription(
      'Nowe pojęcie',
    );
  });

  it('describes a new Term by both the marker and the open popover', async () => {
    const user = userEvent.setup();
    renderChips('en', <TermChip term={node} isNew />);
    const chip = screen.getByRole('button', { name: 'node' });
    await user.click(chip);
    expect(chip).toHaveAccessibleDescription('New term node One item of a list.');
  });

  it('shifts the popover back inside the viewport edge', async () => {
    const user = userEvent.setup();
    const rect = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ left: 300, right: window.innerWidth + 100 } as DOMRect);
    renderChips('en', <TermChip term={node} isNew={false} />);
    const chip = screen.getByRole('button', { name: 'node' });
    await user.click(chip);
    expect(popoverOf(chip)?.style.marginLeft).toBe('-116px');
    rect.mockRestore();
  });
});
