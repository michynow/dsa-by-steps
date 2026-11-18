import { describe, expect, it } from 'vitest';
import { arrayOf, elementIds, entry, errorOf, mapOf, ref, sceneOf, unwrap } from './fixtures';
import { applyStepEvent } from './index';

const scene = sceneOf(
  [mapOf('m', [entry('e0', 'k0', 'v0')], []), arrayOf('a', 'c0')],
  [{ id: 'p', label: 'hit', target: ref('m', 'e0') }],
  [{ target: ref('m', 'e0'), tone: 'done' }],
);

describe('put-entry', () => {
  it('appends a new entry to the bucket', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'put-entry',
        structureId: 'm',
        bucket: 0,
        entry: entry('e1', 'k1'),
      }),
    );
    expect(elementIds(next, 'm')).toEqual(['e0', 'e1']);
  });

  it('appends to an empty bucket', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'put-entry',
        structureId: 'm',
        bucket: 1,
        entry: entry('e1', 'k1'),
      }),
    );
    expect(next.structures[0]).toMatchObject({
      buckets: [[{ id: 'e0' }], [{ id: 'e1' }]],
    });
  });

  it('replaces the value of an entry with the same key and keeps its id', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'put-entry',
        structureId: 'm',
        bucket: 0,
        entry: entry('other-id', 'k0', 'new'),
      }),
    );
    expect(next.structures[0]).toMatchObject({
      buckets: [[{ id: 'e0', key: 'k0', value: 'new' }], []],
    });
  });

  it.each([-1, 2])('reports index-out-of-range for bucket %i', (bucket) => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'put-entry',
        structureId: 'm',
        bucket,
        entry: entry('e1', 'k1'),
      }),
    );
    expect(error).toMatchObject({ code: 'index-out-of-range', index: bucket });
  });

  it('reports duplicate-id for a new key with a used id', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'put-entry',
        structureId: 'm',
        bucket: 1,
        entry: entry('e0', 'k9'),
      }),
    );
    expect(error).toMatchObject({ code: 'duplicate-id', namespace: 'element' });
  });

  it('reports wrong-kind', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'put-entry',
        structureId: 'a',
        bucket: 0,
        entry: entry('e1', 'k1'),
      }),
    );
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'array' });
  });

  it('reports unknown-structure', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'put-entry',
        structureId: 'zzz',
        bucket: 0,
        entry: entry('e1', 'k1'),
      }),
    );
    expect(error.code).toBe('unknown-structure');
  });
});

describe('remove-entry', () => {
  it('removes the entry and cleans references to it', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'remove-entry', target: ref('m', 'e0') }));
    expect(elementIds(next, 'm')).toEqual([]);
    expect(next.highlights).toEqual([]);
    expect(next.pointers.map((p) => p.target)).toEqual([null]);
  });

  it('reports unknown-element', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'remove-entry', target: ref('m', 'zzz') }));
    expect(error.code).toBe('unknown-element');
  });

  it('reports wrong-kind', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'remove-entry', target: ref('a', 'c0') }));
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'array' });
  });
});
