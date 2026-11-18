import { useEffect, useState } from 'react';
import type { Scene } from '@/domain';
import type { ElementItem } from './scene-items';

const FADE_MILLISECONDS = 250;

interface Memory {
  readonly scene: Scene;
  readonly items: readonly ElementItem[];
  readonly leaving: readonly ElementItem[];
}

export function useRetainedElements(
  scene: Scene,
  items: readonly ElementItem[],
): readonly ElementItem[] {
  const [memory, setMemory] = useState<Memory>({ scene, items, leaving: [] });
  if (memory.scene !== scene) {
    const present = new Set(items.map((item) => item.key));
    const gone = [...memory.leaving, ...memory.items].filter((item) => !present.has(item.key));
    setMemory({ scene, items, leaving: gone });
  }
  const { leaving } = memory;
  useEffect(() => {
    if (leaving.length === 0) return undefined;
    const timer = setTimeout(() => {
      setMemory((current) => ({ ...current, leaving: [] }));
    }, FADE_MILLISECONDS);
    return () => {
      clearTimeout(timer);
    };
  }, [leaving]);
  return [...items, ...leaving.map((item) => ({ ...item, leaving: true }))];
}
