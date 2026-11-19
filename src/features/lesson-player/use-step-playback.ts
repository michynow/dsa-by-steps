import { useEffect, useState } from 'react';
import { applyStepEvent, emptyScene, ok } from '@/domain';
import type { Result, Scene, SceneError, StepEvent } from '@/domain';

export const STEP_BEAT_MILLISECONDS = 450;

const ownedByControl =
  'input, textarea, select, button, [contenteditable], [role="radiogroup"], [role="radio"], [role="textbox"], [data-canvas]';

export function framesOf(
  scene: Scene,
  events: readonly StepEvent[],
): Result<readonly Scene[], SceneError> {
  const start: Result<readonly Scene[], SceneError> = ok([scene]);
  return events.reduce((acc, event) => {
    if (!acc.ok) return acc;
    const next = applyStepEvent(acc.value.at(-1) ?? scene, event);
    return next.ok ? ok([...acc.value, next.value]) : next;
  }, start);
}

interface PlaybackState {
  readonly key: string;
  readonly index: number;
  readonly paused: boolean;
}

export interface StepPlayback {
  readonly scene: Scene;
  readonly playing: boolean;
  readonly replay: () => void;
  readonly toggle: () => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function isIgnored(event: KeyboardEvent): boolean {
  const modified = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
  const owned = event.target instanceof Element && event.target.closest(ownedByControl) !== null;
  return event.defaultPrevented || modified || owned;
}

function usePlaybackKeys(replay: () => void, toggle: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isIgnored(event)) return;
      if (event.key === ' ') {
        event.preventDefault();
        toggle();
      } else if (event.key.toLowerCase() === 'r') {
        replay();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [replay, toggle]);
}

export function useStepPlayback(frames: readonly Scene[], key: string): StepPlayback {
  const [state, setState] = useState<PlaybackState>({ key, index: 0, paused: false });
  const last = frames.length - 1;
  const fresh: PlaybackState = { key, index: 0, paused: false };
  if (state.key !== key) setState(fresh);
  const current = state.key === key ? state : fresh;
  const index = prefersReducedMotion() ? last : Math.min(current.index, last);
  const playing = !current.paused && index < last;

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(() => {
      setState({ key, index: index + 1, paused: false });
    }, STEP_BEAT_MILLISECONDS);
    return () => {
      clearTimeout(timer);
    };
  }, [playing, key, index]);

  const replay = (): void => {
    setState({ key, index: 0, paused: false });
  };
  const toggle = (): void => {
    if (index >= last) replay();
    else setState({ key, index, paused: !current.paused });
  };
  usePlaybackKeys(replay, toggle);

  return { scene: frames[index] ?? emptyScene, playing, replay, toggle };
}
