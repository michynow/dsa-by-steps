import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { checkKey, lessonKey } from '@/domain';
import type { Check, CheckState } from '@/domain';
import {
  createMemoryProgressRepository,
  createProgressStore,
  ProgressProvider,
  useProgress,
} from '../progress';
import { useCheckSession } from './use-check-session';

const lesson = lessonKey('arrays', 'binary-search');

const choice: Check = { kind: 'choice', id: 'c1', options: ['a', 'b', 'c'], correct: 'b' };
const predict: Check = {
  kind: 'predict',
  id: 'p1',
  correct: { structureId: 's', elementId: 'e2' },
};
const order: Check = { kind: 'order', id: 'o1', structureId: 's', correct: ['e1', 'e2'] };
const e1 = { structureId: 's', elementId: 'e1' };
const e2 = { structureId: 's', elementId: 'e2' };

function mount(store: ReturnType<typeof createProgressStore>, check: Check) {
  function wrapper({ children }: { readonly children: ReactNode }) {
    return <ProgressProvider store={store}>{children}</ProgressProvider>;
  }
  return renderHook(
    () => ({
      session: useCheckSession(lesson, check),
      stored: useProgress((p) => p.checks[checkKey(lesson, check.id)]),
    }),
    { wrapper },
  );
}

function setup(check: Check, initial?: CheckState) {
  const store = createProgressStore(createMemoryProgressRepository());
  if (initial) store.getState().actions.setCheckState(checkKey(lesson, check.id), initial);
  return { store, ...mount(store, check) };
}

type Mounted = ReturnType<typeof setup>['result'];

function answerChoice(result: Mounted, option: string) {
  act(() => {
    result.current.session.choose(option);
  });
  act(() => {
    result.current.session.submit();
  });
}

describe('useCheckSession choice', () => {
  it('starts open with nothing pending', () => {
    const { result } = setup(choice);
    const { session } = result.current;
    expect({
      state: session.state,
      settled: session.settled,
      lastVerdict: session.lastVerdict,
      pending: session.pending,
      selection: session.selection,
    }).toEqual({
      state: { misses: 0, status: 'open' },
      settled: false,
      lastVerdict: null,
      pending: null,
      selection: undefined,
    });
  });

  it('submitting with nothing chosen changes nothing', () => {
    const { result } = setup(choice);
    act(() => {
      result.current.session.submit();
    });
    expect(result.current.stored).toBeUndefined();
    expect(result.current.session.lastVerdict).toBeNull();
  });

  it('records a Miss for a wrong answer and keeps the check open', () => {
    const { result } = setup(choice);
    answerChoice(result, 'a');
    expect(result.current.stored).toEqual({ misses: 1, status: 'open' });
    expect(result.current.session.lastVerdict).toBe('miss');
    expect(result.current.session.pending).toBe('a');
    expect(result.current.session.settled).toBe(false);
  });

  it('passes on the correct answer', () => {
    const { result } = setup(choice);
    answerChoice(result, 'b');
    expect(result.current.stored).toEqual({ misses: 0, status: 'passed' });
    expect(result.current.session.lastVerdict).toBe('correct');
    expect(result.current.session.settled).toBe(true);
  });

  it('cannot reveal with two Misses but can with three', () => {
    const { result } = setup(choice);
    answerChoice(result, 'a');
    answerChoice(result, 'c');
    act(() => {
      result.current.session.reveal();
    });
    expect(result.current.stored).toEqual({ misses: 2, status: 'open' });
    answerChoice(result, 'a');
    act(() => {
      result.current.session.reveal();
    });
    expect(result.current.stored).toEqual({ misses: 3, status: 'revealed' });
    expect(result.current.session.settled).toBe(true);
  });

  it('ignores answers once settled', () => {
    const { result } = setup(choice);
    answerChoice(result, 'b');
    answerChoice(result, 'a');
    expect(result.current.stored).toEqual({ misses: 0, status: 'passed' });
    expect(result.current.session.pending).toBe('b');
  });

  it('records a Miss for every deliberate re-submit of an unchanged answer', () => {
    const { result } = setup(choice);
    answerChoice(result, 'a');
    act(() => {
      result.current.session.submit();
    });
    act(() => {
      result.current.session.submit();
    });
    expect(result.current.stored).toEqual({ misses: 3, status: 'open' });
  });

  it('records one Verdict for a rapid double submit', () => {
    const { result } = setup(choice);
    act(() => {
      result.current.session.choose('a');
    });
    act(() => {
      result.current.session.submit();
      result.current.session.submit();
    });
    expect(result.current.stored).toEqual({ misses: 1, status: 'open' });
  });

  it('keeps Misses and settled status across a re-mount', () => {
    const { store, result, unmount } = setup(choice);
    answerChoice(result, 'a');
    unmount();
    const again = mount(store, choice);
    expect(again.result.current.session.state).toEqual({ misses: 1, status: 'open' });
    expect(again.result.current.session.lastVerdict).toBeNull();
    answerChoice(again.result, 'b');
    again.unmount();
    expect(mount(store, choice).result.current.session.settled).toBe(true);
  });

  it('treats a persisted revealed state with no Misses as revealed', () => {
    const { result } = setup(choice, { misses: 0, status: 'revealed' });
    expect(result.current.session.settled).toBe(true);
    answerChoice(result, 'a');
    expect(result.current.stored).toEqual({ misses: 0, status: 'revealed' });
  });

  it('ignores a Predict selection', () => {
    const { result } = setup(choice);
    act(() => {
      result.current.session.select(e1);
    });
    expect(result.current.session.pending).toBeNull();
  });
});

describe('useCheckSession predict', () => {
  it('submitting with nothing selected changes nothing', () => {
    const { result } = setup(predict);
    act(() => {
      result.current.session.submit();
    });
    expect(result.current.stored).toBeUndefined();
  });

  it('exposes the pending ref as the selection', () => {
    const { result } = setup(predict);
    act(() => {
      result.current.session.select(e1);
    });
    expect(result.current.session.pending).toEqual(e1);
    expect(result.current.session.selection?.selected).toEqual(e1);
  });

  it('onSelect sets pending', () => {
    const { result } = setup(predict);
    act(() => {
      result.current.session.selection?.onSelect(e1);
    });
    expect(result.current.session.pending).toEqual(e1);
  });

  it('records a Miss then passes and selects the correct target', () => {
    const { result } = setup(predict);
    act(() => {
      result.current.session.select(e1);
    });
    act(() => {
      result.current.session.submit();
    });
    expect(result.current.stored).toEqual({ misses: 1, status: 'open' });
    act(() => {
      result.current.session.select(e2);
    });
    act(() => {
      result.current.session.submit();
    });
    expect(result.current.stored).toEqual({ misses: 1, status: 'passed' });
    expect(result.current.session.selection?.selected).toEqual(e2);
  });

  it('records a Miss for every deliberate re-submit of an unchanged selection', () => {
    const { result } = setup(predict);
    act(() => {
      result.current.session.select(e1);
    });
    act(() => {
      result.current.session.submit();
    });
    act(() => {
      result.current.session.submit();
    });
    act(() => {
      result.current.session.submit();
    });
    expect(result.current.stored).toEqual({ misses: 3, status: 'open' });
  });

  it('records one Verdict for a rapid double submit', () => {
    const { result } = setup(predict);
    act(() => {
      result.current.session.select(e1);
    });
    act(() => {
      result.current.session.submit();
      result.current.session.submit();
    });
    expect(result.current.stored).toEqual({ misses: 1, status: 'open' });
  });

  it('ignores a selection once settled', () => {
    const { result } = setup(predict, { misses: 0, status: 'passed' });
    act(() => {
      result.current.session.select(e1);
    });
    expect(result.current.session.pending).toBeNull();
    expect(result.current.session.selection?.selected).toEqual(e2);
  });

  it('selects the correct target once revealed', () => {
    const { result } = setup(predict, { misses: 3, status: 'open' });
    act(() => {
      result.current.session.select(e1);
    });
    act(() => {
      result.current.session.reveal();
    });
    expect(result.current.stored).toEqual({ misses: 3, status: 'revealed' });
    expect(result.current.session.selection?.selected).toEqual(e2);
  });
});

describe('useCheckSession moving between Checks', () => {
  it('judges a selection on an open Predict Check shown after a settled one', () => {
    const store = createProgressStore(createMemoryProgressRepository());
    store.getState().actions.setCheckState(checkKey(lesson, choice.id), {
      misses: 0,
      status: 'passed',
    });
    function wrapper({ children }: { readonly children: ReactNode }) {
      return <ProgressProvider store={store}>{children}</ProgressProvider>;
    }
    const first: { readonly check: Check } = { check: choice };
    const { result, rerender } = renderHook(
      ({ check }: { readonly check: Check }) => ({
        session: useCheckSession(lesson, check),
        stored: useProgress((p) => p.checks[checkKey(lesson, predict.id)]),
      }),
      { wrapper, initialProps: first },
    );
    rerender({ check: predict });
    act(() => {
      result.current.session.select(e1);
    });
    act(() => {
      result.current.session.submit();
    });
    expect(result.current.stored).toEqual({ misses: 1, status: 'open' });
  });
});

describe('useCheckSession order', () => {
  it('is settled with no selection and ignores everything', () => {
    const { result } = setup(order);
    act(() => {
      result.current.session.choose('a');
      result.current.session.select(e1);
      result.current.session.submit();
      result.current.session.reveal();
    });
    expect({
      settled: result.current.session.settled,
      pending: result.current.session.pending,
      selection: result.current.session.selection,
      stored: result.current.stored,
    }).toEqual({ settled: true, pending: null, selection: undefined, stored: undefined });
  });
});
