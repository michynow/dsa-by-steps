import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { modules as registeredModules } from '@/content';
import type { ModuleContent } from '@/content';
import { createI18n } from '@/features/locale';
import {
  createMemoryProgressRepository,
  createProgressStore,
  ProgressProvider,
} from '@/features/progress';
import { markedModules } from '@/test/term-fixtures';
import { LessonPage, noStepCheck } from './index';

function renderAt(
  path: string,
  locale: 'en' | 'pl',
  modules: readonly ModuleContent[] = markedModules,
) {
  const router = createMemoryRouter(
    [
      {
        path: ':locale/:module/:lesson/:step',
        element: <LessonPage modules={modules} useStepCheck={noStepCheck} />,
      },
    ],
    { initialEntries: [path] },
  );
  const store = createProgressStore(createMemoryProgressRepository());
  return render(
    <I18nextProvider i18n={createI18n(locale)}>
      <ProgressProvider store={store}>
        <RouterProvider router={router} />
      </ProgressProvider>
    </I18nextProvider>,
  );
}

describe('Caption Term Chips', () => {
  it('renders marked Terms as chips with the term text and the new marker on first use only', () => {
    renderAt('/en/basics/stacks/1', 'en');
    const caption = screen.getByText(/holds things/);
    expect(caption.textContent).toBe('A stack new holds things, a stack');
    expect(
      within(caption)
        .getAllByRole('button')
        .map((chip) => chip.textContent),
    ).toEqual(['stack new', 'stack']);
  });

  it('shows the English term in Polish with the Polish gloss', async () => {
    const user = userEvent.setup();
    renderAt('/pl/basics/stacks/1', 'pl');
    const caption = screen.getByText(/holds things/);
    expect(caption.textContent).toBe('PL A stack nowe holds things, a stack');
    await user.click(within(caption).getAllByRole('button')[0] ?? caption);
    expect(screen.getByRole('note').textContent).toBe('stack PL last in, first out');
  });

  it('shows no new marker on a later use of the Term', () => {
    renderAt('/en/basics/stacks/2', 'en');
    expect(screen.getByText(/Push onto the/).textContent).toBe('Push onto the stack');
  });
});

describe('Key Idea', () => {
  it('shows a callout under the Caption when the Step has a Key idea, with chips', () => {
    renderAt('/en/basics/stacks/2', 'en');
    const callout = screen.getByRole('note');
    expect(callout.textContent).toBe('Key ideaKeep the stack in mind');
    expect(within(callout).getByRole('button', { name: 'stack' }).textContent).toBe('stack');
  });

  it('shows no callout when the Step has no Key idea', () => {
    renderAt('/en/basics/stacks/1', 'en');
    expect(screen.queryByRole('note')).toBeNull();
  });
});

describe('Terms panel', () => {
  async function panelChips(path: string) {
    const user = userEvent.setup();
    renderAt(path, 'en');
    await user.click(screen.getByText('Terms'));
    const panel = screen.getByText('Terms').closest('details');
    return within(panel ?? document.body)
      .getAllByRole('button')
      .map((chip) => chip.textContent);
  }

  it('lists only Terms introduced up to the current Step', async () => {
    expect(await panelChips('/en/basics/stacks/2')).toEqual(['stack']);
  });

  it('lists later Terms once the Learner reaches their Step', async () => {
    expect(await panelChips('/en/basics/stacks/3')).toEqual(['stack', 'top']);
  });

  it('is absent while no Term has been introduced', () => {
    renderAt('/en/basics/queues/1', 'en');
    expect(screen.queryByText('Terms')).toBeNull();
  });
});

describe('Story and Uses', () => {
  it('shows the Story card above the Caption on Step 1 only', () => {
    const first = renderAt('/en/basics/stacks/1', 'en');
    expect(screen.getByRole('region', { name: 'Story' }).textContent).toBe('StoryStory of a stack');
    first.unmount();
    renderAt('/en/basics/stacks/2', 'en');
    expect(screen.queryByRole('region', { name: 'Story' })).toBeNull();
  });

  it('shows where you will meet it and when not on the last Step only', () => {
    const middle = renderAt('/en/basics/stacks/2', 'en');
    expect(screen.queryByRole('region', { name: 'Where you will meet it' })).toBeNull();
    middle.unmount();
    renderAt('/en/basics/stacks/3', 'en');
    const section = screen.getByRole('region', { name: 'Where you will meet it' });
    expect(section.textContent).toBe(
      'Where you will meet itUndo Editors keep a stackCalls Calls form a stackWhen not to use it Not for random access to a stack',
    );
  });

  it('shows the Polish labels', () => {
    renderAt('/pl/basics/stacks/3', 'pl');
    expect(screen.getByRole('region', { name: 'Gdzie się z tym spotkasz' }).textContent).toContain(
      'Kiedy tego nie używać',
    );
  });
});

describe('Term markers', () => {
  const cases = registeredModules.flatMap((module) =>
    module.lessons.flatMap((content) =>
      content.lesson.steps.flatMap((_step, index) =>
        (['en', 'pl'] as const).map((locale) => ({
          path: `/${locale}/${module.slug}/${content.lesson.slug}/${String(index + 1)}`,
          locale,
        })),
      ),
    ),
  );

  it('never reach the DOM for any Step of any registered Lesson', () => {
    const leaks = cases.flatMap(({ path, locale }) => {
      const view = renderAt(path, locale, registeredModules);
      const text = document.body.textContent;
      view.unmount();
      return /\[\[|\]\]/.test(text) ? [path] : [];
    });
    expect(leaks).toEqual([]);
  });
});
