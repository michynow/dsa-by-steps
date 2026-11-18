import { describe, expect, it } from 'vitest';
import { arrayOf, cell, elementIds, errorOf, ref, sceneOf, stackOf, unwrap } from './fixtures';
import { applyStepEvent } from './index';

const scene = sceneOf(
  [arrayOf('a', 'c0', 'c1', 'c2'), stackOf('s', 'i0')],
  [
    { id: 'p', label: 'i', target: ref('a', 'c1') },
    { id: 'q', label: 'j', target: ref('a', 'c0') },
  ],
  [
    { target: ref('a', 'c1'), tone: 'focus' },
    { target: ref('a', 'c0'), tone: 'done' },
  ],
);

describe('swap', () => {
  it('exchanges the positions of two cells', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'swap',
        structureId: 'a',
        a: 'c0',
        b: 'c2',
      }),
    );
    expect(elementIds(next, 'a')).toEqual(['c2', 'c1', 'c0']);
  });

  it('reports wrong-kind with the actual kind', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'swap',
        structureId: 's',
        a: 'i0',
        b: 'i0',
      }),
    );
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'stack' });
  });

  it('reports unknown-structure', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'swap',
        structureId: 'zzz',
        a: 'c0',
        b: 'c1',
      }),
    );
    expect(error.code).toBe('unknown-structure');
  });

  it.each(['a', 'b'] as const)('reports unknown-element for %s', (side) => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'swap',
        structureId: 'a',
        a: side === 'a' ? 'zzz' : 'c0',
        b: side === 'b' ? 'zzz' : 'c1',
      }),
    );
    expect(error).toMatchObject({ code: 'unknown-element', elementId: 'zzz' });
  });
});

describe('insert-cell', () => {
  it.each([
    [0, ['n', 'c0', 'c1', 'c2']],
    [2, ['c0', 'c1', 'n', 'c2']],
    [3, ['c0', 'c1', 'c2', 'n']],
  ])('inserts at index %i', (index, expected) => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'insert-cell',
        structureId: 'a',
        index,
        cell: cell('n'),
      }),
    );
    expect(elementIds(next, 'a')).toEqual(expected);
  });

  it.each([-1, 4])('reports index-out-of-range for %i', (index) => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'insert-cell',
        structureId: 'a',
        index,
        cell: cell('n'),
      }),
    );
    expect(error).toMatchObject({ code: 'index-out-of-range', index });
  });

  it('reports duplicate-id in the element namespace', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'insert-cell',
        structureId: 'a',
        index: 0,
        cell: cell('c1'),
      }),
    );
    expect(error).toMatchObject({ code: 'duplicate-id', namespace: 'element' });
  });

  it('reports wrong-kind', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'insert-cell',
        structureId: 's',
        index: 0,
        cell: cell('n'),
      }),
    );
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'stack' });
  });
});

describe('remove-cell', () => {
  it('removes the cell, its Highlights, and nulls Pointer targets to it', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'remove-cell', target: ref('a', 'c1') }));
    expect(elementIds(next, 'a')).toEqual(['c0', 'c2']);
    expect(next.highlights).toEqual([{ target: ref('a', 'c0'), tone: 'done' }]);
    expect(next.pointers.map((p) => p.target)).toEqual([null, ref('a', 'c0')]);
  });

  it('reports unknown-element', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'remove-cell', target: ref('a', 'zzz') }));
    expect(error.code).toBe('unknown-element');
  });

  it('reports wrong-kind', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'remove-cell', target: ref('s', 'i0') }));
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'stack' });
  });
});
