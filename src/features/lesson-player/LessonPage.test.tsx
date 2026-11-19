import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider, useRouteError } from 'react-router';
import type { ReactElement } from 'react';
import type { ModuleContent } from '@/content';
import { createI18n } from '@/features/locale';
import {
  createBrowserProgressRepository,
  createMemoryProgressRepository,
  createProgressStore,
  ProgressProvider,
} from '@/features/progress';
import type { ProgressRepository } from '@/features/progress';
import { createFakeStorage } from '@/test/storage-fakes';
import { testModules } from '@/test/lesson-fixtures';
import { LessonError, LessonPage, LessonRedirect, noStepCheck } from './index';
import type { StepCheckBinding, UseStepCheck } from './index';

interface Options {
  readonly useStepCheck?: UseStepCheck;
  readonly repository?: ProgressRepository;
  readonly locale?: 'en' | 'pl';
  readonly modules?: readonly ModuleContent[];
  readonly errorElement?: ReactElement;
}

function renderAt(path: string, options: Options = {}) {
  const {
    useStepCheck = noStepCheck,
    repository,
    locale = 'en',
    modules = testModules,
    errorElement = <LessonError />,
  } = options;
  const router = createMemoryRouter(
    [
      { path: ':locale', element: <p>course home</p> },
      { path: ':locale/:module/:lesson', element: <LessonRedirect modules={modules} /> },
      {
        path: ':locale/:module/:lesson/:step',
        element: <LessonPage modules={modules} useStepCheck={useStepCheck} />,
        errorElement,
      },
    ],
    { initialEntries: [path] },
  );
  const store = createProgressStore(repository ?? createMemoryProgressRepository());
  const i18n = createI18n(locale);
  render(
    <I18nextProvider i18n={i18n}>
      <ProgressProvider store={store}>
        <RouterProvider router={router} />
      </ProgressProvider>
    </I18nextProvider>,
  );
  return { router, store, i18n };
}

function fakeCheck(
  initiallySettled: boolean,
  selection?: StepCheckBinding['selection'],
): UseStepCheck {
  return function useFakeCheck(_lesson, _check, messages): StepCheckBinding {
    const [settled, setSettled] = useState(initiallySettled);
    return {
      settled,
      selection,
      panel: (
        <div>
          <p>{messages.prompt}</p>
          <div role="radiogroup" aria-label="options">
            <label>
              <input type="radio" name="option" /> on top
            </label>
          </div>
          <input type="text" aria-label="free answer" />
          <button
            type="button"
            onClick={() => {
              setSettled(true);
            }}
          >
            settle
          </button>
          {settled ? <p>{messages.explanation}</p> : null}
        </div>
      ),
    };
  };
}

const sceneLines = () =>
  within(screen.getByRole('figure'))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

const railNames = () =>
  within(screen.getByRole('navigation', { name: 'Steps' }))
    .getAllByRole('link')
    .map((link) => link.textContent.replace(/\s+/g, ' ').trim());

describe('LessonPage', () => {
  it('redirects the Lesson URL to Step 1', async () => {
    const { router } = renderAt('/en/basics/stacks');
    await screen.findByRole('heading', { level: 1, name: 'Stacks' });
    expect(router.state.location.pathname).toBe('/en/basics/stacks/1');
  });

  it('redirects a Lesson without Steps to the Course home', async () => {
    const { router } = renderAt('/en/solo/bare');
    await screen.findByText('course home');
    expect(router.state.location.pathname).toBe('/en');
  });

  it('redirects an unknown Lesson URL to the Course home', async () => {
    const { router } = renderAt('/en/basics/nope');
    await screen.findByText('course home');
    expect(router.state.location.pathname).toBe('/en');
  });

  it('shows the Step title and Caption with a Problem marker', () => {
    renderAt('/en/basics/stacks/1');
    expect(screen.getByRole('heading', { level: 2, name: 'Why stacks' })).toBeVisible();
    expect(screen.getByText('Why stacks caption')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Why stacks' })).toHaveTextContent(
      'ProblemWhy stacksWhy stacks captionPreviousNext',
    );
  });

  it('shows scenesOf(lesson)[i] for Step i', () => {
    renderAt('/en/basics/queues/2');
    expect(sceneLines()).toEqual(['Stack: j2 (top), j1, i0']);
  });

  it.each(['0', '-1', '1.5', 'abc', '4', '01', 'CODE', 'code'])(
    'redirects the invalid step %s to the Course home',
    async (step) => {
      const { router } = renderAt(`/en/basics/stacks/${step}`);
      await screen.findByText('course home');
      expect(router.state.location.pathname).toBe('/en');
    },
  );

  it('redirects step 1 of a Lesson without Steps to the Course home', async () => {
    const { router } = renderAt('/en/solo/bare/1');
    await screen.findByText('course home');
    expect(router.state.location.pathname).toBe('/en');
  });

  it('lists every Step in the Rail with their state', async () => {
    const user = userEvent.setup();
    renderAt('/en/basics/stacks/1');
    expect(railNames()).toEqual([
      '1 Why stacks Problem current',
      '2 Push one Your turn not seen yet',
      '3 Pop one not seen yet',
    ]);
    await user.click(screen.getByRole('link', { name: /^3 Pop one/ }));
    expect(railNames()).toEqual([
      '1 Why stacks Problem seen',
      '2 Push one Your turn not seen yet',
      '3 Pop one current',
    ]);
  });

  it('marks a Step seen once it is viewed', () => {
    const { store } = renderAt('/en/basics/stacks/1');
    expect(store.getState().progress.stepsSeen).toEqual({ 'basics/stacks': ['why'] });
  });

  it('updates the document title with the Lesson and Course title', async () => {
    const { i18n } = renderAt('/en/basics/stacks/1');
    expect(document.title).toBe('Stacks · DSA by steps');
    await act(async () => {
      await i18n.changeLanguage('pl');
    });
    expect(document.title).toBe('PL Stacks · DSA krok po kroku');
  });

  it('shows interface text in the current Locale', () => {
    renderAt('/pl/basics/stacks/1', { locale: 'pl' });
    expect(screen.getByRole('navigation', { name: 'Kroki' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Wstecz' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'PL Why stacks' })).toBeVisible();
  });

  it('expands the Outcomes and Terms panels on demand', async () => {
    const user = userEvent.setup();
    renderAt('/en/basics/stacks/1');
    expect(screen.getByText('Push and pop')).not.toBeVisible();
    await user.click(screen.getByText('Outcomes'));
    expect(screen.getByText('Push and pop')).toBeVisible();
    expect(screen.getByText('last in, first out')).not.toBeVisible();
    await user.click(screen.getByText('Terms'));
    expect(screen.getByText('last in, first out')).toBeVisible();
  });

  it('renders with corrupt stored Progress and shows every Step unseen', () => {
    const storage = createFakeStorage({ 'dsa-by-steps.progress': '{not json' });
    renderAt('/en/basics/stacks/2', { repository: createBrowserProgressRepository(storage) });
    expect(railNames()).toEqual([
      '1 Why stacks Problem not seen yet',
      '2 Push one Your turn current',
      '3 Pop one not seen yet',
    ]);
  });

  it('marks a Step seen exactly once across re-renders', async () => {
    const { store, i18n } = renderAt('/en/basics/stacks/1');
    const spy = vi.spyOn(store.getState().actions, 'markStepSeen');
    act(() => {
      store.getState().actions.recordSubmit('basics/queues', 'pass');
    });
    await act(async () => {
      await i18n.changeLanguage('pl');
    });
    expect(spy.mock.calls).toEqual([]);
    expect(store.getState().progress.stepsSeen).toEqual({ 'basics/stacks': ['why'] });
  });

  it('keeps focus on Next and the same Stage when moving into a checked Step', async () => {
    const user = userEvent.setup();
    renderAt('/en/basics/stacks/1', { useStepCheck: fakeCheck(true) });
    const stage = screen.getByRole('figure');
    screen.getByRole('button', { name: 'Next' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { level: 2, name: 'Push one' })).toBeVisible();
    expect(screen.getByRole('figure')).toBe(stage);
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });
});

describe('LessonPage navigation', () => {
  it('goes to the next and previous Step with the buttons', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/1');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(router.state.location.pathname).toBe('/en/basics/stacks/2');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(router.state.location.pathname).toBe('/en/basics/stacks/1');
  });

  it('crosses into the next Lesson and back without an Exercise position', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/3');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(router.state.location.pathname).toBe('/en/basics/queues/1');
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(router.state.location.pathname).toBe('/en/basics/stacks/3');
  });

  it('skips the Exercise with the arrow keys in both directions', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/3');
    await user.keyboard('{ArrowRight}');
    expect(router.state.location.pathname).toBe('/en/basics/queues/1');
    await user.keyboard('{ArrowLeft}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/3');
  });

  it('ends at the last Step of the last Lesson with Steps', () => {
    renderAt('/en/basics/queues/2');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('moves with the arrow keys outside form controls', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/1');
    await user.keyboard('{ArrowRight}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/2');
    await user.keyboard('{ArrowLeft}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/1');
  });

  it('reads the current Step for two arrow keys fired before React re-renders', () => {
    const { router } = renderAt('/en/basics/stacks/3');
    const press = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    act(() => {
      press();
      press();
    });
    expect(router.state.location.pathname).toBe('/en/basics/queues/1');
  });

  it('does not skip a checked Step when two arrow keys arrive before the re-render', () => {
    const { router } = renderAt('/en/basics/stacks/1');
    const press = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    act(() => {
      press();
      press();
    });
    expect(router.state.location.pathname).toBe('/en/basics/stacks/2');
  });

  it('moves with the arrow keys while a button has focus', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/1');
    screen.getByRole('button', { name: 'Next' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/2');
  });

  it('leaves the arrow keys to a radio group', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(true) });
    await user.click(screen.getByRole('radio'));
    await user.keyboard('{ArrowRight}{ArrowLeft}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/2');
  });

  it('leaves the arrow keys to a text field', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(true) });
    await user.click(screen.getByRole('textbox', { name: 'free answer' }));
    await user.keyboard('{ArrowRight}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/2');
  });

  it('leaves the arrow keys to the Stage selection controls and passes the selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const selection = { selected: { structureId: 's', elementId: 'i0' }, onSelect };
    const { router } = renderAt('/en/basics/stacks/2', {
      useStepCheck: fakeCheck(true, selection),
    });
    const pressed = screen
      .getAllByRole('button', { pressed: true })
      .map((button) => button.getAttribute('aria-label'));
    expect(pressed).toEqual(['Select i0, Stack, Index 2']);
    screen.getByRole('button', { name: 'Select i1, Stack, Index 1' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/2');
    await user.click(screen.getByRole('button', { name: 'Select i1, Stack, Index 1' }));
    expect(onSelect).toHaveBeenCalledWith({ structureId: 's', elementId: 'i1' });
  });
});

describe('LessonPage checks', () => {
  it('blocks next while the Check is unsettled, with a visible reason', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).toHaveAccessibleDescription('Answer the question to continue.');
    expect(screen.getByText('Answer the question to continue.')).toBeVisible();
    await user.click(next);
    await user.keyboard('{ArrowRight}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/2');
    await user.keyboard('{ArrowLeft}');
    expect(router.state.location.pathname).toBe('/en/basics/stacks/1');
  });

  it('keeps previous and the Rail free while the Check is unsettled', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    await user.click(screen.getByRole('link', { name: /^3 Pop one/ }));
    expect(router.state.location.pathname).toBe('/en/basics/stacks/3');
  });

  it('unblocks next once the Check settles', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    await user.click(screen.getByRole('button', { name: 'settle' }));
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('aria-disabled', 'false');
    expect(screen.queryByText('Answer the question to continue.')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(router.state.location.pathname).toBe('/en/basics/stacks/3');
  });

  it('shows the Scene before an unsettled Step and only the Check prompt', () => {
    renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    expect(sceneLines()).toEqual(['Stack: i1 (top), i0']);
    expect(screen.getByText('Where does it go?')).toBeVisible();
    expect(screen.queryByText('Push one caption')).toBeNull();
    expect(screen.queryByRole('heading', { level: 2, name: 'Push one' })).toBeNull();
    expect(screen.queryByText('On top.')).toBeNull();
  });

  it('shows the initial Scene before an unsettled first Step', () => {
    renderAt('/en/basics/queues/1', { useStepCheck: fakeCheck(false) });
    expect(sceneLines()).toEqual(['Stack: i0 (top)']);
  });

  it('shows the Step Scene, Caption and explanation once the Check settles', async () => {
    const user = userEvent.setup();
    renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    await user.click(screen.getByRole('button', { name: 'settle' }));
    expect(sceneLines()).toEqual(['Stack: i2 (top), i1, i0']);
    expect(screen.getByRole('heading', { level: 2, name: 'Push one' })).toBeVisible();
    expect(screen.getByText('Push one caption')).toBeVisible();
    expect(screen.getByText('On top.')).toBeVisible();
  });

  it('shows the Step Scene and Caption at once when the Check is already settled', () => {
    renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(true) });
    expect(sceneLines()).toEqual(['Stack: i2 (top), i1, i0']);
    expect(screen.getByText('Push one caption')).toBeVisible();
  });

  it('marks a checked Step seen only once it is settled', async () => {
    const user = userEvent.setup();
    const { store } = renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    expect(store.getState().progress.stepsSeen).toEqual({});
    expect(railNames()).toContain('2 Push one Your turn current');
    await user.click(screen.getByRole('button', { name: 'settle' }));
    expect(store.getState().progress.stepsSeen).toEqual({ 'basics/stacks': ['push'] });
  });

  it('leaves Steps without a Check unchanged under an unsettled binding', () => {
    renderAt('/en/basics/stacks/1', { useStepCheck: fakeCheck(false) });
    expect(sceneLines()).toEqual(['Stack: i1 (top), i0']);
    expect(screen.getByText('Why stacks caption')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('aria-disabled', 'false');
  });
});

describe('LessonPage Practice and Your turn', () => {
  const frame = () => document.querySelector('[data-stage]');

  it('links the last Step to its Practice detail', () => {
    renderAt('/en/basics/stacks/3');
    expect(screen.getByRole('link', { name: 'Practice this' })).toHaveAttribute(
      'href',
      '/en/practice/basics/stacks',
    );
  });

  it('keeps the Practice link in the Locale of the page', () => {
    renderAt('/pl/basics/stacks/3', { locale: 'pl' });
    expect(screen.getByRole('link', { name: 'Przećwicz to' })).toHaveAttribute(
      'href',
      '/pl/practice/basics/stacks',
    );
  });

  it('shows no Practice link before the last Step', () => {
    renderAt('/en/basics/stacks/2');
    expect(screen.queryByRole('link', { name: 'Practice this' })).toBeNull();
  });

  it('frames the Stage and shows the banner while the Check is unsettled', () => {
    renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    expect(frame()).toHaveAttribute('data-turn', 'true');
    expect(screen.getByText('Your turn — predict what happens')).toBeVisible();
  });

  it('announces the banner politely', () => {
    renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    expect(
      screen.getByText('Your turn — predict what happens').closest('[aria-live]'),
    ).toHaveAttribute('aria-live', 'polite');
  });

  it('drops the frame and the banner once the Check settles', async () => {
    const user = userEvent.setup();
    renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(false) });
    await user.click(screen.getByRole('button', { name: 'settle' }));
    expect(frame()).toHaveAttribute('data-turn', 'false');
    expect(screen.queryByText('Your turn — predict what happens')).toBeNull();
  });

  it('shows neither on a settled or unchecked Step', () => {
    renderAt('/en/basics/stacks/2', { useStepCheck: fakeCheck(true) });
    expect(frame()).toHaveAttribute('data-turn', 'false');
    expect(screen.queryByText('Your turn — predict what happens')).toBeNull();
  });

  it('shows neither on a Step without a Check under an unsettled binding', () => {
    renderAt('/en/basics/stacks/1', { useStepCheck: fakeCheck(false) });
    expect(frame()).toHaveAttribute('data-turn', 'false');
  });
});

describe('LessonPage broken content', () => {
  const [basics] = testModules;
  const stacks = basics?.lessons[0];
  const captured: unknown[] = [];

  function CaptureError() {
    captured.push(useRouteError());
    return <LessonError />;
  }

  const brokenModules = (lesson: Partial<ModuleContent['lessons'][number]>): ModuleContent[] => {
    if (!stacks) throw new Error('fixture');
    return [{ ...testModules[0], lessons: [{ ...stacks, ...lesson }] } as ModuleContent];
  };

  beforeEach(() => {
    captured.length = 0;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows an error message when the current Locale lacks the Check messages', () => {
    if (!stacks) throw new Error('fixture');
    const messages = { ...stacks.messages, en: { ...stacks.messages.en, checks: {} } };
    renderAt('/en/basics/stacks/2', {
      modules: brokenModules({ messages }),
      errorElement: <CaptureError />,
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This Lesson cannot be shown.Its content is broken. Please report it.',
    );
    expect([...new Set(captured.map(String))]).toEqual([
      'Error: Missing en messages for Check "c-push" in Lesson "basics/stacks"',
    ]);
  });

  it('shows an error message when the Lesson does not reduce to Scenes', () => {
    if (!stacks) throw new Error('fixture');
    const steps = [
      {
        id: 'why',
        kind: 'problem' as const,
        events: [{ type: 'pop' as const, structureId: 'zzz' }],
      },
    ];
    renderAt('/en/basics/stacks/1', {
      modules: brokenModules({ lesson: { ...stacks.lesson, steps } }),
      errorElement: <CaptureError />,
    });
    expect(screen.getByRole('alert')).toBeVisible();
    expect([...new Set(captured.map(String))]).toEqual([
      'Error: Lesson "basics/stacks" does not reduce to Scenes: unknown-structure',
    ]);
  });
});
