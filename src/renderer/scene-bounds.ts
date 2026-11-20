import type { Scene } from '@/domain';
import { layoutScene } from './layout';

export interface SceneBounds {
  readonly width: number;
  readonly height: number;
}

export function boundsOf(scenes: readonly Scene[]): SceneBounds {
  return scenes.reduce<SceneBounds>(
    (bounds, scene) => {
      const { width, height } = layoutScene(scene);
      return { width: Math.max(bounds.width, width), height: Math.max(bounds.height, height) };
    },
    { width: 0, height: 0 },
  );
}
