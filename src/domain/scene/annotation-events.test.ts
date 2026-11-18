import { describe, expect, it } from 'vitest';
import { arrayOf, errorOf, ref, sceneOf, unwrap } from '@/test/scene-fixtures';
import { applyStepEvent } from './index';

const scene = sceneOf(
  [arrayOf('a', 'c0', 'c1')],
  [{ id: 'p', label: 'i', target: ref('a', 'c0') }],
  [
    { target: ref('a', 'c0'), tone: 'focus' },
    { target: ref('a', 'c1'), tone: 'done' },
  ],
);

describe('point', () => {
  it('adds a Pointer', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'point',
        pointer: { id: 'q', label: 'j', target: ref('a', 'c1') },
      }),
    );
    expect(next.pointers.map((p) => p.id)).toEqual(['p', 'q']);
  });

  it('accepts a null target', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'point',
        pointer: { id: 'q', label: 'j', target: null },
      }),
    );
    expect(next.pointers).toHaveLength(2);
  });

  it('reports duplicate-id in the pointer namespace', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'point',
        pointer: { id: 'p', label: 'x', target: null },
      }),
    );
    expect(error).toMatchObject({
      code: 'duplicate-id',
      namespace: 'pointer',
      id: 'p',
    });
  });

  it('reports unknown-structure for a target in a missing Structure', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'point',
        pointer: { id: 'q', label: 'x', target: ref('zzz', 'c0') },
      }),
    );
    expect(error.code).toBe('unknown-structure');
  });

  it('reports unknown-element for a missing target element', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'point',
        pointer: { id: 'q', label: 'x', target: ref('a', 'zzz') },
      }),
    );
    expect(error).toMatchObject({ code: 'unknown-element', elementId: 'zzz' });
  });
});

describe('move-pointer', () => {
  it('retargets the Pointer', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'move-pointer',
        pointerId: 'p',
        target: ref('a', 'c1'),
      }),
    );
    expect(next.pointers[0]?.target).toEqual(ref('a', 'c1'));
  });

  it('accepts a null target', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'move-pointer',
        pointerId: 'p',
        target: null,
      }),
    );
    expect(next.pointers[0]?.target).toBeNull();
  });

  it('reports unknown-pointer', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'move-pointer',
        pointerId: 'zzz',
        target: null,
      }),
    );
    expect(error).toMatchObject({ code: 'unknown-pointer', pointerId: 'zzz' });
  });

  it('reports unknown-element for a missing target', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'move-pointer',
        pointerId: 'p',
        target: ref('a', 'zzz'),
      }),
    );
    expect(error.code).toBe('unknown-element');
  });

  it('reports unknown-structure for a missing target Structure', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'move-pointer',
        pointerId: 'p',
        target: ref('zzz', 'c0'),
      }),
    );
    expect(error.code).toBe('unknown-structure');
  });
});

describe('drop-pointer', () => {
  it('removes the Pointer', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'drop-pointer', pointerId: 'p' }));
    expect(next.pointers).toEqual([]);
  });

  it('reports unknown-pointer', () => {
    const error = errorOf(applyStepEvent(scene, { type: 'drop-pointer', pointerId: 'zzz' }));
    expect(error.code).toBe('unknown-pointer');
  });
});

describe('highlight', () => {
  it('adds a Highlight', () => {
    const empty = sceneOf([arrayOf('a', 'c0')]);
    const next = unwrap(
      applyStepEvent(empty, {
        type: 'highlight',
        highlight: { target: ref('a', 'c0'), tone: 'compare' },
      }),
    );
    expect(next.highlights).toEqual([{ target: ref('a', 'c0'), tone: 'compare' }]);
  });

  it('replaces any existing Highlight on the same target', () => {
    const next = unwrap(
      applyStepEvent(scene, {
        type: 'highlight',
        highlight: { target: ref('a', 'c0'), tone: 'error' },
      }),
    );
    expect(next.highlights).toEqual([
      { target: ref('a', 'c1'), tone: 'done' },
      { target: ref('a', 'c0'), tone: 'error' },
    ]);
  });

  it('reports unknown-element', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'highlight',
        highlight: { target: ref('a', 'zzz'), tone: 'focus' },
      }),
    );
    expect(error.code).toBe('unknown-element');
  });

  it('reports unknown-structure', () => {
    const error = errorOf(
      applyStepEvent(scene, {
        type: 'highlight',
        highlight: { target: ref('zzz', 'c0'), tone: 'focus' },
      }),
    );
    expect(error.code).toBe('unknown-structure');
  });
});

describe('clear-highlights', () => {
  it('removes all Highlights', () => {
    const next = unwrap(applyStepEvent(scene, { type: 'clear-highlights' }));
    expect(next.highlights).toEqual([]);
    expect(next.pointers).toEqual(scene.pointers);
  });
});
