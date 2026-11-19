import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { CheckMessages } from '@/content';
import { checkKey, lessonKey } from '@/domain';
import type { Check } from '@/domain';
import { createI18n } from '../locale';
import { createMemoryProgressRepository, createProgressStore, ProgressProvider } from '../progress';
import { CheckPanel } from './CheckPanel';
import { useCheckSession } from './use-check-session';
import { useStepCheckBinding } from './use-step-check-binding';

const lesson = lessonKey('arrays', 'binary-search');
const choice: Check = { kind: 'choice', id: 'c1', options: ['a', 'b', 'c'], correct: 'b' };
const predict: Check = {
  kind: 'predict',
  id: 'p1',
  correct: { structureId: 's', elementId: 'e2' },
};
const order: Check = { kind: 'order', id: 'o1', structureId: 's', correct: ['e1', 'e2'] };
const messages: CheckMessages = {
  prompt: 'Which one?',
  options: { a: 'Alpha', b: 'Bravo', c: 'Charlie' },
  explanation: 'Because bravo.',
};
const e1 = { structureId: 's', elementId: 'e1' };

function Harness(props: { readonly check: Check; readonly msgs?: CheckMessages }): ReactElement {
  const session = useCheckSession(lesson, props.check);
  return (
    <>
      <CheckPanel session={session} messages={props.msgs ?? messages} />
      <button
        onClick={() => {
          session.select(e1);
        }}
      >
        stage select
      </button>
    </>
  );
}

function renderPanel(check: Check, msgs?: CheckMessages) {
  const store = createProgressStore(createMemoryProgressRepository());
  const i18n = createI18n('en');
  const treeFor = (next: Check, nextMsgs?: CheckMessages): ReactElement => (
    <I18nextProvider i18n={i18n}>
      <ProgressProvider store={store}>
        <Harness check={next} {...(nextMsgs ? { msgs: nextMsgs } : {})} />
      </ProgressProvider>
    </I18nextProvider>
  );
  const result = render(treeFor(check, msgs));
  return {
    user: userEvent.setup(),
    store,
    ...result,
    showCheck: (next: Check) => {
      result.rerender(treeFor(next));
    },
  };
}

async function missTwiceChoice(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: 'Alpha' }));
  await user.click(screen.getByRole('button', { name: 'Check answer' }));
  await user.click(screen.getByRole('radio', { name: 'Charlie' }));
  await user.click(screen.getByRole('button', { name: 'Check answer' }));
}

describe('CheckPanel choice', () => {
  it('renders the prompt and a radiogroup of the labelled options', () => {
    renderPanel(choice);
    const group = screen.getByRole('radiogroup', { name: 'Which one?' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('moves selection between options with the arrow keys', async () => {
    const { user } = renderPanel(choice);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Bravo' })).toBeChecked();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Charlie' })).toBeChecked();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Bravo' })).toBeChecked();
  });

  it('shows an inline message when submitting with nothing chosen', async () => {
    const { user } = renderPanel(choice);
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Pick an option first.');
    expect(screen.queryByRole('button', { name: 'Show me' })).not.toBeInTheDocument();
  });

  it('announces a wrong answer politely and keeps the options editable', async () => {
    const { user } = renderPanel(choice);
    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Not right. Try again.');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('radio', { name: 'Bravo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Check answer' })).toHaveFocus();
  });

  it('offers Show me only after the third Miss', async () => {
    const { user } = renderPanel(choice);
    await missTwiceChoice(user);
    expect(screen.queryByRole('button', { name: 'Show me' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('button', { name: 'Show me' })).toBeInTheDocument();
  });

  it('reveals the correct option and explanation and moves focus to it', async () => {
    const { user } = renderPanel(choice);
    await missTwiceChoice(user);
    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Show me' }));
    const correct = screen.getByRole('radio', { name: 'Bravo' });
    expect(correct).toBeChecked();
    expect(correct).toHaveAccessibleDescription('correct answer');
    expect(screen.getByText('Because bravo.')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Here is the answer.');
  });

  it('passes on the correct answer and becomes read-only', async () => {
    const { user } = renderPanel(choice);
    await user.click(screen.getByRole('radio', { name: 'Bravo' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Correct.');
    expect(screen.getByText('Because bravo.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check answer' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((radio) => radio.hasAttribute('disabled'))).toEqual([
      true,
      true,
      true,
    ]);
  });

  it('does not crash and renders no radio for an option without a label', () => {
    renderPanel(choice, { ...messages, options: { a: 'Alpha', b: 'Bravo' } });
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'a',
      'b',
    ]);
  });

  it('does not crash when messages carry no options at all', () => {
    const { prompt, explanation } = messages;
    renderPanel(choice, { prompt, explanation });
    expect(screen.queryAllByRole('radio')).toEqual([]);
  });
});

describe('CheckPanel review fixes', () => {
  const otherChoice: Check = { ...choice, id: 'c2' };

  it('counts every wrong submit, including an unchanged answer', async () => {
    const { user } = renderPanel(choice);
    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('button', { name: 'Show me' })).toBeInTheDocument();
  });

  it('counts every wrong submit of an unchanged Predict selection', async () => {
    const { user } = renderPanel(predict);
    await user.click(screen.getByRole('button', { name: 'stage select' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('button', { name: 'Show me' })).toBeInTheDocument();
  });

  it('forgets an empty submit when the Check changes', async () => {
    const { user, showCheck } = renderPanel(choice);
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    showCheck(otherChoice);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('does not steal focus when a different, already passed Check appears', async () => {
    const { user, store, showCheck } = renderPanel(choice);
    store.getState().actions.setCheckState(checkKey(lesson, 'c2'), { misses: 0, status: 'passed' });
    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    showCheck(otherChoice);
    expect(screen.getByText('Because bravo.')).not.toHaveFocus();
  });

  it('submits a focused radio on Enter', async () => {
    const { user } = renderPanel(choice);
    await user.click(screen.getByRole('radio', { name: 'Bravo' }));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Correct.');
  });
});

describe('CheckPanel predict', () => {
  it('shows the prompt and asks for a selection when submitting empty', async () => {
    const { user } = renderPanel(predict);
    expect(screen.getByText('Which one?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Select an element on the Stage first.');
  });

  it('records a Miss for a wrong selection', async () => {
    const { user } = renderPanel(predict);
    await user.click(screen.getByRole('button', { name: 'stage select' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Not right. Try again.');
  });
});

describe('CheckPanel order', () => {
  it('renders the prompt with no controls', () => {
    renderPanel(order);
    expect(screen.getByText('Which one?')).toBeInTheDocument();
    expect(screen.getByText('Because bravo.')).toBeInTheDocument();
    expect(screen.queryAllByRole('button').map((button) => button.textContent)).toEqual([
      'stage select',
    ]);
  });
});

describe('useStepCheckBinding', () => {
  it('returns settled, selection and a panel consistent with the session', () => {
    const store = createProgressStore(createMemoryProgressRepository());
    const i18n = createI18n('en');
    function wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <I18nextProvider i18n={i18n}>
          <ProgressProvider store={store}>{children}</ProgressProvider>
        </I18nextProvider>
      );
    }
    const { result } = renderHook(() => useStepCheckBinding(lesson, predict, messages), {
      wrapper,
    });
    expect(result.current.settled).toBe(false);
    expect(result.current.selection?.selected).toBeNull();
    render(<>{result.current.panel}</>, { wrapper });
    expect(screen.getByText('Which one?')).toBeInTheDocument();
  });
});

describe('CheckPanel Your turn card', () => {
  it('is a labelled region headed by the prompt with a Your turn header', () => {
    renderPanel(choice);
    const region = screen.getByRole('region', { name: 'Your turn' });
    expect(region).toHaveTextContent('Your turn · Check');
    expect(screen.getByRole('heading', { name: 'Which one?' })).toBeInTheDocument();
  });

  it('hides the Miss counter at zero Misses', () => {
    renderPanel(choice);
    expect(screen.queryByText(/Misses/)).not.toBeInTheDocument();
  });

  it('shows the Miss counter while open with Misses', async () => {
    const { user } = renderPanel(choice);
    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Misses 1 of 3')).toBeInTheDocument();
  });

  it('hides the Miss counter once passed after a Miss', async () => {
    const { user } = renderPanel(choice);
    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('radio', { name: 'Bravo' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.queryByText(/Misses/)).not.toBeInTheDocument();
  });

  it('hides the Miss counter once revealed', async () => {
    const { user } = renderPanel(choice);
    await missTwiceChoice(user);
    await user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    await user.click(screen.getByRole('button', { name: 'Show me' }));
    expect(screen.queryByText(/Misses/)).not.toBeInTheDocument();
  });

  it('says Correct when passed and Answer shown when revealed', async () => {
    const first = renderPanel(choice);
    await first.user.click(screen.getByRole('radio', { name: 'Bravo' }));
    await first.user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('region', { name: 'Your turn' })).toHaveTextContent('Correct');
    first.unmount();
    const second = renderPanel(choice);
    await missTwiceChoice(second.user);
    await second.user.click(screen.getByRole('radio', { name: 'Alpha' }));
    await second.user.click(screen.getByRole('button', { name: 'Check answer' }));
    await second.user.click(screen.getByRole('button', { name: 'Show me' }));
    expect(screen.getByRole('region', { name: 'Your turn' })).toHaveTextContent('Answer shown');
  });
});
