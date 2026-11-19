import { applyStepEvents, emptyScene } from '@/domain';
import type { Scene, StepEvent } from '@/domain';
import { arrayOf, errorOf, sceneOf, unwrap } from '@/test/scene-fixtures';
import { framesOf } from './use-step-playback';

const create: StepEvent = { type: 'create', structure: arrayOf('arr', 'a') };
const grow: StepEvent = {
  type: 'insert-cell',
  structureId: 'arr',
  index: 1,
  cell: { id: 'b', value: 'b' },
};

describe('framesOf', () => {
  it('returns the Scene before the Step then the Scene after each event', () => {
    const frames = unwrap(framesOf(emptyScene, [create, grow]));
    const expected: readonly Scene[] = [
      emptyScene,
      sceneOf([arrayOf('arr', 'a')]),
      sceneOf([arrayOf('arr', 'a', 'b')]),
    ];
    expect(frames).toEqual(expected);
  });

  it('ends on the Scene that applying every event produces', () => {
    const frames = unwrap(framesOf(emptyScene, [create, grow]));
    expect(frames.at(-1)).toEqual(unwrap(applyStepEvents(emptyScene, [create, grow])));
  });

  it('returns only the starting Scene for a Step without events', () => {
    expect(unwrap(framesOf(emptyScene, []))).toEqual([emptyScene]);
  });

  it('propagates the error of an event that cannot apply', () => {
    const missing: StepEvent = { type: 'remove', structureId: 'nope' };
    expect(errorOf(framesOf(emptyScene, [create, missing]))).toEqual(
      errorOf(applyStepEvents(emptyScene, [create, missing])),
    );
  });
});
