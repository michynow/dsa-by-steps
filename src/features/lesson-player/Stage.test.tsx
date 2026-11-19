import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Scene } from '@/domain';
import { arrayOf, sceneOf } from '@/test/scene-fixtures';
import en from './messages/en.json';
import { Stage } from './Stage';
import { STEP_BEAT_MILLISECONDS } from './use-step-playback';

const scene = { structures: [], pointers: [], highlights: [] };

function stage(stepId: string) {
  return <Stage frames={[scene]} messages={en} selection={undefined} turn stepId={stepId} />;
}

describe('Stage turn frame', () => {
  it('replaces the announced banner when the Step changes', () => {
    const { rerender } = render(stage('a'));
    const first = screen.getByText('Your turn — answer before the step plays');
    rerender(stage('b'));
    const second = screen.getByText('Your turn — answer before the step plays');
    expect(second === first).toBe(false);
  });

  it('keeps the banner node while the Step stays the same', () => {
    const { rerender } = render(stage('a'));
    const first = screen.getByText('Your turn — answer before the step plays');
    rerender(stage('a'));
    expect(screen.getByText('Your turn — answer before the step plays') === first).toBe(true);
  });

  it('marks the frame with a turn data attribute only while the Check is open', () => {
    const { container, rerender } = render(stage('a'));
    expect(container.querySelector('[data-stage]')?.getAttribute('data-turn')).toBe('true');
    rerender(
      <Stage frames={[scene]} messages={en} selection={undefined} turn={false} stepId="a" />,
    );
    expect(container.querySelector('[data-stage]')?.getAttribute('data-turn')).toBe('false');
  });
});

const framesOf = (...rows: readonly (readonly string[])[]): readonly Scene[] =>
  rows.map((row) => sceneOf([arrayOf('arr', ...row)]));

const growing = framesOf(['a'], ['a', 'b'], ['a', 'b', 'c']);
const other = framesOf(['x'], ['x', 'y']);

function playing(frames: readonly Scene[], stepId: string, turn = false) {
  return <Stage frames={frames} messages={en} selection={undefined} turn={turn} stepId={stepId} />;
}

function shown(container: HTMLElement): readonly string[] {
  return [...container.querySelectorAll('[data-element]:not([data-leaving])')].map(
    (node) => node.textContent,
  );
}

function beat(count = 1): void {
  for (let step = 0; step < count; step += 1) {
    act(() => {
      vi.advanceTimersByTime(STEP_BEAT_MILLISECONDS);
    });
  }
}

function withFakeTimers(body: () => void): void {
  vi.useFakeTimers();
  try {
    body();
  } finally {
    vi.useRealTimers();
  }
}

function withReducedMotion(body: () => void): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
  }));
  vi.useFakeTimers();
  try {
    body();
  } finally {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  }
}

describe('Stage playback', () => {
  it('shows the frames one beat apart and ends on the Step Scene', () => {
    withFakeTimers(() => {
      const { container } = render(playing(growing, 'one'));
      const seen = [shown(container)];
      beat();
      seen.push(shown(container));
      beat();
      seen.push(shown(container));
      beat(5);
      seen.push(shown(container));
      expect(seen).toEqual([['a'], ['a', 'b'], ['a', 'b', 'c'], ['a', 'b', 'c']]);
    });
  });

  it('stops the old Step when navigating away and plays the new Step from its first frame', () => {
    withFakeTimers(() => {
      const { container, rerender } = render(playing(growing, 'one'));
      beat();
      rerender(playing(other, 'two'));
      const seen = [shown(container)];
      beat();
      seen.push(shown(container));
      beat(5);
      seen.push(shown(container));
      expect(seen).toEqual([['x'], ['x', 'y'], ['x', 'y']]);
    });
  });

  it('plays a Step again when navigating back to it', () => {
    withFakeTimers(() => {
      const { container, rerender } = render(playing(growing, 'one'));
      beat(2);
      rerender(playing(other, 'two'));
      rerender(playing(growing, 'one'));
      const seen = [shown(container)];
      beat();
      seen.push(shown(container));
      expect(seen).toEqual([['a'], ['a', 'b']]);
    });
  });

  it('plays the Step once its Check settles', () => {
    withFakeTimers(() => {
      const { container, rerender } = render(playing(growing.slice(0, 1), 'one', true));
      const seen = [shown(container)];
      beat(3);
      seen.push(shown(container));
      rerender(playing(growing, 'one'));
      seen.push(shown(container));
      beat();
      seen.push(shown(container));
      expect(seen).toEqual([['a'], ['a'], ['a'], ['a', 'b']]);
    });
  });

  it('replays from the first frame with the Replay button', () => {
    withFakeTimers(() => {
      const { container } = render(playing(growing, 'one'));
      beat(5);
      fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
      const seen = [shown(container)];
      beat();
      seen.push(shown(container));
      expect(seen).toEqual([['a'], ['a', 'b']]);
    });
  });

  it('pauses and resumes with the Pause and Play button', () => {
    withFakeTimers(() => {
      const { container } = render(playing(growing, 'one'));
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
      beat(5);
      const seen = [shown(container)];
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      beat();
      seen.push(shown(container));
      expect(seen).toEqual([['a'], ['a', 'b']]);
    });
  });

  it('replays with the R key', () => {
    withFakeTimers(() => {
      const { container } = render(playing(growing, 'one'));
      beat(5);
      fireEvent.keyDown(document.body, { key: 'r' });
      expect(shown(container)).toEqual(['a']);
    });
  });

  it('pauses and resumes with Space without scrolling the page', () => {
    withFakeTimers(() => {
      const { container } = render(playing(growing, 'one'));
      const pausedNotPrevented = fireEvent.keyDown(document.body, { key: ' ' });
      beat(5);
      const seen = [shown(container)];
      fireEvent.keyDown(document.body, { key: ' ' });
      beat();
      seen.push(shown(container));
      expect({ pausedNotPrevented, seen }).toEqual({
        pausedNotPrevented: false,
        seen: [['a'], ['a', 'b']],
      });
    });
  });

  it('leaves R and Space to form controls and radio groups', () => {
    withFakeTimers(() => {
      const { container } = render(playing(growing, 'one'));
      const input = document.body.appendChild(document.createElement('input'));
      const radio = document.body.appendChild(document.createElement('div'));
      radio.setAttribute('role', 'radio');
      beat(5);
      const results = [
        fireEvent.keyDown(input, { key: ' ' }),
        fireEvent.keyDown(input, { key: 'r' }),
        fireEvent.keyDown(radio, { key: ' ' }),
        fireEvent.keyDown(radio, { key: 'r' }),
      ];
      input.remove();
      radio.remove();
      expect({ results, shown: shown(container) }).toEqual({
        results: [true, true, true, true],
        shown: ['a', 'b', 'c'],
      });
    });
  });

  it('shows the final Scene at once under reduced motion', () => {
    withReducedMotion(() => {
      const { container } = render(playing(growing, 'one'));
      expect(shown(container)).toEqual(['a', 'b', 'c']);
    });
  });

  it('keeps the controls working under reduced motion', () => {
    withReducedMotion(() => {
      const { container } = render(playing(growing, 'one'));
      fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
      beat();
      expect(shown(container)).toEqual(['a', 'b', 'c']);
    });
  });
});
