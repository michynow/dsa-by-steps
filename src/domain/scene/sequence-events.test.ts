import { describe, expect, it } from 'vitest';
import {
  arrayOf,
  cell,
  elementIds,
  errorOf,
  queueOf,
  ref,
  sceneOf,
  stackOf,
  unwrap,
} from '@/test/scene-fixtures';
import { applyStepEvent } from './index';

const scene = sceneOf(
  [
    stackOf('s', 'i0', 'i1'),
    queueOf('q', 'j0', 'j1'),
    stackOf('empty-s'),
    queueOf('empty-q'),
    arrayOf('a', 'c0'),
  ],
  [
    { id: 'top', label: 'top', target: ref('s', 'i1') },
    { id: 'front', label: 'front', target: ref('q', 'j0') },
  ],
  [
    { target: ref('s', 'i1'), tone: 'focus' },
    { target: ref('q', 'j0'), tone: 'focus' },
  ],
);

describe('push', () => {
  it('adds an item on top', () => {
    const next = unwrap(
      applyStepEvent(scene, { type: 'push', structureId: 's', cell: cell('i2') }),
    );
    expect(elementIds(next, 's')).toEqual(['i0', 'i1', 'i2']);
  });

  it('reports duplicate-id', () => {
    const error = errorOf(
      applyStepEvent(scene, { type: 'push', structureId: 's', cell: cell('i0') }),
    );
    expect(error).toMatchObject({ code: 'duplicate-id', namespace: 'element' });
  });

  it('reports wrong-kind for a queue', () => {
    const error = errorOf(
      applyStepEvent(scene, { type: 'push', structureId: 'q', cell: cell('x') }),
    );
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'queue' });
  });

  it('reports unknown-structure', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'push',
        structureId: 'zzz',
        cell: cell('x'),
      }),
    );
    expect(error.code).toBe('unknown-structure');
  });
});

describe('pop', () => {
  it('removes the last item and cleans references to it', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'pop', structureId: 's' }));
    expect(elementIds(next, 's')).toEqual(['i0']);
    expect(next.highlights).toEqual([{ target: ref('q', 'j0'), tone: 'focus' }]);
    expect(next.pointers.map((p) => p.target)).toEqual([null, ref('q', 'j0')]);
  });

  it('reports empty-structure', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'pop', structureId: 'empty-s' }));
    expect(error).toMatchObject({
      code: 'empty-structure',
      structureId: 'empty-s',
    });
  });

  it('reports wrong-kind for a queue', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'pop', structureId: 'q' }));
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'queue' });
  });
});

describe('enqueue', () => {
  it('adds an item at the back', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'enqueue',
        structureId: 'q',
        cell: cell('j2'),
      }),
    );
    expect(elementIds(next, 'q')).toEqual(['j0', 'j1', 'j2']);
  });

  it('reports duplicate-id', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'enqueue',
        structureId: 'q',
        cell: cell('j1'),
      }),
    );
    expect(error).toMatchObject({ code: 'duplicate-id', namespace: 'element' });
  });

  it('reports wrong-kind for a stack', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'enqueue',
        structureId: 's',
        cell: cell('x'),
      }),
    );
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'stack' });
  });
});

describe('dequeue', () => {
  it('removes the first item and cleans references to it', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'dequeue', structureId: 'q' }));
    expect(elementIds(next, 'q')).toEqual(['j1']);
    expect(next.highlights).toEqual([{ target: ref('s', 'i1'), tone: 'focus' }]);
    expect(next.pointers.map((p) => p.target)).toEqual([ref('s', 'i1'), null]);
  });

  it('reports empty-structure', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'dequeue', structureId: 'empty-q' }));
    expect(error.code).toBe('empty-structure');
  });

  it('reports wrong-kind for a stack', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'dequeue', structureId: 's' }));
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'stack' });
  });
});
