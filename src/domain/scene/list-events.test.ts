import { describe, expect, it } from 'vitest';
import { arrayOf, errorOf, listOf, node, ref, sceneOf, unwrap } from './fixtures';
import { applyStepEvent } from './index';
import type { Scene } from './index';

const scene = sceneOf(
  [listOf('l', 'n0', node('n0', 'n1'), node('n1', 'n2'), node('n2')), arrayOf('a', 'c0')],
  [{ id: 'p', label: 'cur', target: ref('l', 'n1') }],
  [{ target: ref('l', 'n1'), tone: 'focus' }],
);

function listOfScene(next: Scene) {
  const found = next.structures.find((s) => s.id === 'l');
  return found?.kind === 'linked-list' ? found : undefined;
}

describe('add-node', () => {
  it('appends a node whose next exists', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'add-node',
        structureId: 'l',
        node: node('n3', 'n0'),
      }),
    );
    expect(listOfScene(next)?.nodes.map((n) => n.id)).toEqual(['n0', 'n1', 'n2', 'n3']);
  });

  it('accepts a null next', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'add-node',
        structureId: 'l',
        node: node('n3'),
      }),
    );
    expect(listOfScene(next)?.nodes).toHaveLength(4);
  });

  it('reports unknown-element when next does not exist', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'add-node',
        structureId: 'l',
        node: node('n3', 'ghost'),
      }),
    );
    expect(error).toMatchObject({ code: 'unknown-element', elementId: 'ghost' });
  });

  it('reports duplicate-id', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'add-node',
        structureId: 'l',
        node: node('n1'),
      }),
    );
    expect(error).toMatchObject({ code: 'duplicate-id', namespace: 'element' });
  });

  it('reports wrong-kind', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'add-node',
        structureId: 'a',
        node: node('n3'),
      }),
    );
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'array' });
  });

  it('reports unknown-structure', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'add-node',
        structureId: 'zzz',
        node: node('n3'),
      }),
    );
    expect(error.code).toBe('unknown-structure');
  });
});

describe('remove-node', () => {
  it('nulls every next referring to the removed node and cleans references', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'remove-node', target: ref('l', 'n1') }));
    expect(listOfScene(next)?.nodes).toEqual([node('n0', null), node('n2')]);
    expect(next.highlights).toEqual([]);
    expect(next.pointers.map((p) => p.target)).toEqual([null]);
  });

  it('nulls the head when the head node is removed', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'remove-node', target: ref('l', 'n0') }));
    expect(listOfScene(next)?.head).toBeNull();
  });

  it('reports unknown-element', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'remove-node', target: ref('l', 'zzz') }));
    expect(error.code).toBe('unknown-element');
  });

  it('reports wrong-kind', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'remove-node', target: ref('a', 'c0') }));
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'array' });
  });
});

describe('link', () => {
  it('points a node at another node', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'link',
        structureId: 'l',
        from: 'n0',
        to: 'n2',
      }),
    );
    expect(listOfScene(next)?.nodes[0]?.next).toBe('n2');
  });

  it('points a node at null', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'link',
        structureId: 'l',
        from: 'n0',
        to: null,
      }),
    );
    expect(listOfScene(next)?.nodes[0]?.next).toBeNull();
  });

  it('reports cycle when the link closes a loop', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'link',
        structureId: 'l',
        from: 'n2',
        to: 'n0',
      }),
    );
    expect(error).toMatchObject({ code: 'cycle', structureId: 'l' });
  });

  it('reports cycle for a self link', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'link',
        structureId: 'l',
        from: 'n0',
        to: 'n0',
      }),
    );
    expect(error.code).toBe('cycle');
  });

  it('reports unknown-element for a missing from', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'link',
        structureId: 'l',
        from: 'zzz',
        to: null,
      }),
    );
    expect(error).toMatchObject({ code: 'unknown-element', elementId: 'zzz' });
  });

  it('reports unknown-element for a missing to', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'link',
        structureId: 'l',
        from: 'n0',
        to: 'zzz',
      }),
    );
    expect(error).toMatchObject({ code: 'unknown-element', elementId: 'zzz' });
  });

  it('reports wrong-kind', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'link',
        structureId: 'a',
        from: 'c0',
        to: null,
      }),
    );
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'array' });
  });
});

describe('set-head', () => {
  it('moves the head to an existing node', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'set-head', structureId: 'l', head: 'n2' }));
    expect(listOfScene(next)?.head).toBe('n2');
  });

  it('accepts null', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'set-head', structureId: 'l', head: null }));
    expect(listOfScene(next)?.head).toBeNull();
  });

  it('reports unknown-element', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'set-head',
        structureId: 'l',
        head: 'zzz',
      }),
    );
    expect(error.code).toBe('unknown-element');
  });

  it('reports wrong-kind', () => {
    const error = errorOf(
      applyStepEvent(scene, { type: 'set-head', structureId: 'a', head: null }),
    );
    expect(error).toMatchObject({ code: 'wrong-kind', actual: 'array' });
  });
});
