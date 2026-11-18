import { describe, expect, it } from 'vitest';
import {
  arrayOf,
  cell,
  entry,
  errorOf,
  listOf,
  mapOf,
  node,
  ref,
  sceneOf,
  stackOf,
  unwrap,
} from '@/test/scene-fixtures';
import { applyStepEvent, emptyScene } from './index';
import type { Structure } from './index';

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
  const scene = sceneOf([arrayOf('a', 'c0')]);
  const cells = (ids: readonly string[], changed: string) =>
    ids.map((id, i) => cell(id, id === changed ? 42 : i));
  const cases: readonly (readonly [string, Structure, Structure, string])[] = [
    [
      'array cell',
      { kind: 'array', id: 'x', cells: cells(['p', 'q', 'r'], '') },
      { kind: 'array', id: 'x', cells: cells(['p', 'q', 'r'], 'q') },
      'q',
    ],
    [
      'stack item',
      { kind: 'stack', id: 'x', items: cells(['p', 'q', 'r'], '') },
      { kind: 'stack', id: 'x', items: cells(['p', 'q', 'r'], 'q') },
      'q',
    ],
    [
      'queue item',
      { kind: 'queue', id: 'x', items: cells(['p', 'q', 'r'], '') },
      { kind: 'queue', id: 'x', items: cells(['p', 'q', 'r'], 'q') },
      'q',
    ],
    [
      'list node',
      listOf('x', 'p', node('p', 'q', 0), node('q', 'r', 1), node('r', null, 2)),
      listOf('x', 'p', node('p', 'q', 0), node('q', 'r', 42), node('r', null, 2)),
      'q',
    ],
    [
      'hash-map entry',
      mapOf('x', [entry('p', 'k0', 0)], [entry('q', 'k1', 1), entry('r', 'k2', 2)]),
      mapOf('x', [entry('p', 'k0', 0)], [entry('q', 'k1', 1), entry('r', 'k2', 42)]),
      'r',
    ],
  ];

  it.each(cases)(
    'sets only the targeted %s and leaves every other element unchanged',
    (_name, before, after, targetId) => {
      const bystander = arrayOf('other', 'o0', 'o1');
      const next = unwrap(
        applyStepEvent(sceneOf([bystander, before]), {
          type: 'set-value',
          target: ref('x', targetId),
          value: 42,
        }),
      );
      expect(next.structures).toEqual([bystander, after]);
    },
  );

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
