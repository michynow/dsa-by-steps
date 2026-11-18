import { describe, expect, it } from 'vitest';
import {
  arrayOf,
  cell,
  entry,
  errorOf,
  listOf,
  mapOf,
  node,
  queueOf,
  ref,
  sceneOf,
  stackOf,
  unwrap,
} from './fixtures';
import { applyStepEvent, emptyScene } from './index';

describe('create', () => {
  it('adds the Structure to the Scene', () => {
    const structure = arrayOf('a', 'c0');
    const scene = unwrap(applyStepEvent(emptyScene, { type: 'create', structure }));
    expect(scene.structures).toEqual([structure]);
  });

  it('rejects a duplicate structure id', () => {
    const scene = sceneOf([arrayOf('a')]);
    const error = errorOf(applyStepEvent(scene, { type: 'create', structure: stackOf('a') }));
    expect(error).toMatchObject({
      code: 'duplicate-id',
      namespace: 'structure',
      id: 'a',
    });
  });

  it('rejects duplicate element ids inside the new Structure', () => {
    const error = errorOf(
      applyStepEvent(emptyScene, {
        type: 'create',
        structure: arrayOf('a', 'c0', 'c0'),
      }),
    );
    expect(error).toMatchObject({
      code: 'duplicate-id',
      namespace: 'element',
      id: 'c0',
    });
  });

  it('rejects duplicate entry ids across hash-map buckets', () => {
    const structure = mapOf('m', [entry('e', 'k1')], [entry('e', 'k2')]);
    const error = errorOf(applyStepEvent(emptyScene, { type: 'create', structure }));
    expect(error).toMatchObject({ code: 'duplicate-id', namespace: 'element' });
  });

  it('accepts a valid linked-list', () => {
    const structure = listOf('l', 'n0', node('n0', 'n1'), node('n1'));
    const scene = unwrap(applyStepEvent(emptyScene, { type: 'create', structure }));
    expect(scene.structures).toEqual([structure]);
  });

  it('rejects a linked-list whose next refers to a missing node', () => {
    const structure = listOf('l', 'n0', node('n0', 'ghost'));
    const error = errorOf(applyStepEvent(emptyScene, { type: 'create', structure }));
    expect(error).toMatchObject({
      code: 'unknown-element',
      elementId: 'ghost',
    });
  });

  it('rejects a linked-list whose head refers to a missing node', () => {
    const structure = listOf('l', 'ghost', node('n0'));
    const error = errorOf(applyStepEvent(emptyScene, { type: 'create', structure }));
    expect(error).toMatchObject({
      code: 'unknown-element',
      elementId: 'ghost',
    });
  });

  it('rejects a linked-list with a cycle', () => {
    const structure = listOf('l', 'n0', node('n0', 'n1'), node('n1', 'n0'));
    const error = errorOf(applyStepEvent(emptyScene, { type: 'create', structure }));
    expect(error).toMatchObject({ code: 'cycle', structureId: 'l' });
  });

  it('rejects a linked-list node pointing at itself', () => {
    const structure = listOf('l', 'n0', node('n0', 'n0'));
    const error = errorOf(applyStepEvent(emptyScene, { type: 'create', structure }));
    expect(error.code).toBe('cycle');
  });
});

describe('remove', () => {
  const scene = sceneOf(
    [arrayOf('a', 'c0'), arrayOf('b', 'd0')],
    [
      { id: 'p', label: 'i', target: ref('a', 'c0') },
      { id: 'q', label: 'j', target: ref('b', 'd0') },
    ],
    [
      { target: ref('a', 'c0'), tone: 'focus' },
      { target: ref('b', 'd0'), tone: 'done' },
    ],
  );

  it('deletes the Structure, nulls Pointer targets and drops Highlights referring to it', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'remove', structureId: 'a' }));
    expect(next.structures.map((s) => s.id)).toEqual(['b']);
    expect(next.pointers).toEqual([
      { id: 'p', label: 'i', target: null },
      { id: 'q', label: 'j', target: ref('b', 'd0') },
    ]);
    expect(next.highlights).toEqual([{ target: ref('b', 'd0'), tone: 'done' }]);
  });

  it('reports unknown-structure', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'remove', structureId: 'zzz' }));
    expect(error).toMatchObject({
      code: 'unknown-structure',
      structureId: 'zzz',
    });
  });
});

describe('set-value', () => {
  const scene = sceneOf([
    arrayOf('a', 'c0'),
    stackOf('s', 'i0'),
    queueOf('q', 'i1'),
    listOf('l', 'n0', node('n0')),
    mapOf('m', [entry('e0', 'k')]),
  ]);

  it.each([
    ['array cell', 'a', 'c0'],
    ['stack item', 's', 'i0'],
    ['queue item', 'q', 'i1'],
    ['list node', 'l', 'n0'],
    ['hash-map entry', 'm', 'e0'],
  ])('sets the value of a %s', (_name, structureId, elementId) => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'set-value',
        target: ref(structureId, elementId),
        value: 42,
      }),
    );
    expect(JSON.stringify(next).match(/"value":42/g)).toHaveLength(1);
  });

  it('keeps the other elements untouched', () => {
    const two = sceneOf([{ kind: 'array', id: 'a', cells: [cell('c0', 1), cell('c1', 2)] }]);
    const next = unwrap(
      applyStepEvent(two, {
        type: 'set-value',
        target: ref('a', 'c1'),
        value: 9,
      }),
    );
    expect(next.structures).toEqual([
      { kind: 'array', id: 'a', cells: [cell('c0', 1), cell('c1', 9)] },
    ]);
  });

  it('reports unknown-structure', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'set-value',
        target: ref('zzz', 'c0'),
        value: 1,
      }),
    );
    expect(error.code).toBe('unknown-structure');
  });

  it('reports unknown-element', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'set-value',
        target: ref('a', 'zzz'),
        value: 1,
      }),
    );
    expect(error).toMatchObject({ code: 'unknown-element', elementId: 'zzz' });
  });
});
