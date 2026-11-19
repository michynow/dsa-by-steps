import { useCallback, useEffect, useRef, useState } from 'react';
import type { Scene } from '@/domain';
import { prefersReducedMotion } from '@/ui';
import { FALLBACK_MILLISECONDS } from './metrics';
import type { ElementItem } from './scene-items';

interface Memory {
  readonly scene: Scene;
  readonly items: readonly ElementItem[];
  readonly leaving: readonly ElementItem[];
}

export interface RetainedElements {
  readonly elements: readonly ElementItem[];
  readonly release: (key: string) => void;
}

export function useRetainedElements(scene: Scene, items: readonly ElementItem[]): RetainedElements {
  const [memory, setMemory] = useState<Memory>({ scene, items, leaving: [] });
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  if (memory.scene !== scene) {
    const present = new Set(items.map((item) => item.key));
    const gone = prefersReducedMotion()
      ? []
      : [...memory.leaving, ...memory.items].filter((item) => !present.has(item.key));
    setMemory({ scene, items, leaving: gone });
  }
  const release = useCallback((key: string) => {
    clearTimeout(timers.current.get(key));
    timers.current.delete(key);
    setMemory((current) => ({
      ...current,
      leaving: current.leaving.filter((item) => item.key !== key),
    }));
  }, []);
  const { leaving } = memory;
  useEffect(() => {
    const keys = new Set(leaving.map((item) => item.key));
    timers.current.forEach((timer, key) => {
      if (!keys.has(key)) {
        clearTimeout(timer);
        timers.current.delete(key);
      }
    });
    keys.forEach((key) => {
      if (!timers.current.has(key)) {
        timers.current.set(
          key,
          setTimeout(() => {
            release(key);
          }, FALLBACK_MILLISECONDS),
        );
      }
    });
  }, [leaving, release]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
    };
  }, []);
  return {
    elements: [...items, ...leaving.map((item) => ({ ...item, leaving: true }))],
    release,
  };
}
