import { renderHook } from '@testing-library/react';
import type { Lesson } from '@/domain';
import { arrayOf, cell, sceneOf } from '@/test/scene-fixtures';
import { useLessonScenes, useStepFrames } from './use-lesson-scenes';

const initial = sceneOf([arrayOf('arr', 'a')]);
const lesson: Lesson = {
  slug: 'demo',
  outcomes: [],
  initialScene: initial,
  steps: [
    {
      id: 'grow',
      kind: 'explain',
      events: [
        { type: 'insert-cell', structureId: 'arr', index: 1, cell: cell('b') },
        { type: 'insert-cell', structureId: 'arr', index: 2, cell: cell('c') },
      ],
    },
  ],
};

const ab = sceneOf([arrayOf('arr', 'a', 'b')]);
const abc = sceneOf([arrayOf('arr', 'a', 'b', 'c')]);

function framesWhen(gated: boolean) {
  const scenes = renderHook(() => useLessonScenes(lesson, 'm/demo')).result.current;
  return renderHook(() => useStepFrames(lesson, scenes, 0, gated)).result.current;
}

describe('useStepFrames', () => {
  it('holds only the Scene before the Step while its Check is open', () => {
    expect(framesWhen(true)).toEqual([initial]);
  });

  it('plays every frame of the Step once settled', () => {
    expect(framesWhen(false)).toEqual([initial, ab, abc]);
  });
});
