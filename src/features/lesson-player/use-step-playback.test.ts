import { act, renderHook } from '@testing-library/react';
import { arrayOf, sceneOf } from '@/test/scene-fixtures';
import { STEP_BEAT_MILLISECONDS, useStepPlayback } from './use-step-playback';

const frames = [
  sceneOf([arrayOf('arr', 'a')]),
  sceneOf([arrayOf('arr', 'a', 'b')]),
  sceneOf([arrayOf('arr', 'a', 'b', 'c')]),
];

describe('useStepPlayback', () => {
  it('leaves no timer behind once unmounted mid-playback', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = renderHook(() => useStepPlayback(frames, 'k'));
      const running = vi.getTimerCount();
      unmount();
      expect({ running, afterUnmount: vi.getTimerCount() }).toEqual({
        running: 1,
        afterUnmount: 0,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('advances one frame per beat', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useStepPlayback(frames, 'k'));
      const seen = [result.current.scene];
      act(() => {
        vi.advanceTimersByTime(STEP_BEAT_MILLISECONDS);
      });
      seen.push(result.current.scene);
      expect(seen).toEqual([frames[0], frames[1]]);
    } finally {
      vi.useRealTimers();
    }
  });
});
