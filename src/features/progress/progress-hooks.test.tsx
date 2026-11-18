import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptyProgress, lessonKey, markStepSeen, stepsSeenIn } from '@/domain';
import type { ReactElement } from 'react';
import { createFakeStorage } from '@/test/storage-fakes';
import {
  createBrowserProgressRepository,
  createMemoryProgressRepository,
} from './progress-repository';
import { createProgressStore } from './progress-store';
import { ProgressProvider } from './ProgressProvider';
import { useProgress, useProgressActions, useProgressLoad } from './progress-hooks';

const lesson = lessonKey('arrays', 'binary-search');

function setup(): ReturnType<typeof createProgressStore> {
  return createProgressStore(createMemoryProgressRepository());
}

describe('progress hooks', () => {
  it('useProgress re-renders only when the selected value changes', () => {
    const store = setup();
    let renders = 0;
    function Seen(): ReactElement {
      renders += 1;
      const seen = useProgress((progress) => stepsSeenIn(progress, lesson).length);
      return <p>{seen}</p>;
    }
    render(
      <ProgressProvider store={store}>
        <Seen />
      </ProgressProvider>,
    );
    expect(renders).toBe(1);
    act(() => {
      store.getState().actions.saveExerciseCode(lessonKey('other', 'lesson'), 'x');
    });
    expect(renders).toBe(1);
    act(() => {
      store.getState().actions.markStepSeen(lesson, 'intro');
    });
    expect(renders).toBe(2);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('useProgressActions updates consumers', () => {
    function Consumer(): ReactElement {
      const seen = useProgress((progress) => stepsSeenIn(progress, lesson).join(','));
      const actions = useProgressActions();
      return (
        <button
          onClick={() => {
            actions.markStepSeen(lesson, 'intro');
          }}
        >
          seen:{seen}
        </button>
      );
    }
    render(
      <ProgressProvider store={setup()}>
        <Consumer />
      </ProgressProvider>,
    );
    act(() => {
      screen.getByRole('button', { name: 'seen:' }).click();
    });
    expect(screen.getByRole('button', { name: 'seen:intro' })).toBeInTheDocument();
  });

  it('useProgressLoad exposes how Progress was loaded', () => {
    function Load(): ReactElement {
      return <p>{useProgressLoad().kind}</p>;
    }
    render(
      <ProgressProvider store={setup()}>
        <Load />
      </ProgressProvider>,
    );
    expect(screen.getByText('fresh')).toBeInTheDocument();
  });

  it.each([
    ['useProgress', () => useProgress((progress) => progress)],
    ['useProgressActions', () => useProgressActions()],
    ['useProgressLoad', () => useProgressLoad()],
  ])('%s throws outside ProgressProvider', (_name, hook) => {
    function Probe(): ReactElement {
      hook();
      return <p />;
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow('Progress hooks must be used inside ProgressProvider');
    spy.mockRestore();
  });

  it('does not loop or over-render when the selector returns a new array', () => {
    const store = setup();
    const present = lessonKey('arrays', 'present');
    const absent = lessonKey('arrays', 'absent');
    store.getState().actions.markStepSeen(present, 'a');
    let renders = 0;
    function Steps(): ReactElement {
      renders += 1;
      const missing = useProgress((progress) => stepsSeenIn(progress, absent));
      const found = useProgress((progress) => stepsSeenIn(progress, present));
      return <p>{`${String(missing.length)}:${found.join(',')}`}</p>;
    }
    render(
      <ProgressProvider store={store}>
        <Steps />
      </ProgressProvider>,
    );
    expect(renders).toBe(1);
    act(() => {
      store.getState().actions.saveExerciseCode(lesson, 'x');
    });
    expect(renders).toBe(1);
    act(() => {
      store.getState().actions.markStepSeen(present, 'b');
    });
    expect(renders).toBe(2);
    expect(screen.getByText('0:a,b')).toBeInTheDocument();
  });

  it('useProgressLoad reports restored Progress', () => {
    const progress = markStepSeen(emptyProgress, lesson, 'a');
    const store = createProgressStore(createMemoryProgressRepository(progress));
    function Load(): ReactElement {
      return <p>{JSON.stringify(useProgressLoad())}</p>;
    }
    render(
      <ProgressProvider store={store}>
        <Load />
      </ProgressProvider>,
    );
    expect(screen.getByText(JSON.stringify({ kind: 'restored', progress }))).toBeInTheDocument();
  });

  it('useProgressLoad reports a recovered load', () => {
    const storage = createFakeStorage({ 'dsa-by-steps.progress': '{nope' });
    const store = createProgressStore(createBrowserProgressRepository(storage));
    function Load(): ReactElement {
      return <p>{JSON.stringify(useProgressLoad())}</p>;
    }
    render(
      <ProgressProvider store={store}>
        <Load />
      </ProgressProvider>,
    );
    const error = { code: 'malformed', issues: ['not valid JSON'] };
    expect(screen.getByText(JSON.stringify({ kind: 'recovered', error }))).toBeInTheDocument();
  });

  it('updates every consumer when Progress changes', () => {
    const store = setup();
    function Version(props: { readonly label: string }): ReactElement {
      const seen = useProgress((progress) => stepsSeenIn(progress, lesson).join(','));
      return <p>{`${props.label}=${seen}`}</p>;
    }
    render(
      <ProgressProvider store={store}>
        <Version label="one" />
        <Version label="two" />
      </ProgressProvider>,
    );
    act(() => {
      store.getState().actions.markStepSeen(lesson, 'a');
    });
    expect(screen.getByText('one=a')).toBeInTheDocument();
    expect(screen.getByText('two=a')).toBeInTheDocument();
  });
});
