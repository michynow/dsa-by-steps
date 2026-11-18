import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emptyProgress, lessonKey, markStepSeen, stepsSeenIn } from '@/domain';
import type { ReactElement } from 'react';
import { createMemoryProgressRepository } from './progress-repository';
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

  it('shares one Progress value across consumers', () => {
    const store = setup();
    store.getState().actions.replace(markStepSeen(emptyProgress, lesson, 'a'));
    function Version(): ReactElement {
      return <p>{useProgress((progress) => stepsSeenIn(progress, lesson).join(','))}</p>;
    }
    render(
      <ProgressProvider store={store}>
        <Version />
      </ProgressProvider>,
    );
    expect(screen.getByText('a')).toBeInTheDocument();
  });
});
