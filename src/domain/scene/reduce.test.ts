import { describe, expect, it } from 'vitest';
import type { Lesson, Step } from '../course';
import {
  arrayOf,
  cell,
  deepFreeze,
  elementIds,
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
import { applyStepEvent, applyStepEvents, scenesOf } from './index';
import type { StepEvent } from './index';

const everyEvent: readonly StepEvent[] = [
  { type: 'create', structure: arrayOf('x', 'x0') },
  { type: 'remove', structureId: 's' },
  { type: 'set-value', target: ref('a', 'c0'), value: 1 },
  { type: 'swap', structureId: 'a', a: 'c0', b: 'c1' },
  { type: 'insert-cell', structureId: 'a', index: 0, cell: cell('n') },
  { type: 'remove-cell', target: ref('a', 'c0') },
  { type: 'add-node', structureId: 'l', node: node('n3') },
  { type: 'remove-node', target: ref('l', 'n0') },
  { type: 'link', structureId: 'l', from: 'n0', to: null },
  { type: 'set-head', structureId: 'l', head: 'n1' },
  { type: 'push', structureId: 's', cell: cell('i1') },
  { type: 'pop', structureId: 's' },
  { type: 'enqueue', structureId: 'q', cell: cell('j1') },
  { type: 'dequeue', structureId: 'q' },
  {
    type: 'put-entry',
    structureId: 'm',
    bucket: 0,
    entry: entry('e1', 'k1'),
  },
  { type: 'remove-entry', target: ref('m', 'e0') },
  { type: 'point', pointer: { id: 'p2', label: 'x', target: null } },
  { type: 'move-pointer', pointerId: 'p', target: null },
  { type: 'drop-pointer', pointerId: 'p' },
  {
    type: 'highlight',
    highlight: { target: ref('a', 'c0'), tone: 'focus' },
  },
  { type: 'clear-highlights' },
];

const base = sceneOf(
  [
    arrayOf('a', 'c0', 'c1'),
    listOf('l', 'n0', node('n0', 'n1'), node('n1', 'n2'), node('n2')),
    stackOf('s', 'i0'),
    queueOf('q', 'j0'),
    mapOf('m', [entry('e0', 'k0')]),
  ],
  [{ id: 'p', label: 'i', target: ref('a', 'c0') }],
  [{ target: ref('a', 'c1'), tone: 'done' }],
);

describe('applyStepEvent', () => {
  it.each(everyEvent.map((event) => [event.type, event] as const))(
    'does not mutate its input Scene for %s',
    (_type, event) => {
      const input = deepFreeze(structuredClone(base));
      expect(() => applyStepEvent(input, event)).not.toThrow();
      expect(applyStepEvent(input, event).ok).toBe(true);
      expect(input).toEqual(base);
    },
  );

  it('does not mutate its input Scene when an error is returned', () => {
    const input = deepFreeze(structuredClone(base));
    expect(applyStepEvent(input, { type: 'pop', structureId: 'a' }).ok).toBe(false);
    expect(input).toEqual(base);
  });

  it('carries the offending event in the error', () => {
    const event: StepEvent = { type: 'pop', structureId: 'zzz' };
    expect(errorOf(applyStepEvent(base, event)).event).toBe(event);
  });
});

describe('applyStepEvents', () => {
  it('applies events in order', () => {
    const next = unwrap(
      applyStepEvents(base, [
        { type: 'push', structureId: 's', cell: cell('i1') },
        { type: 'push', structureId: 's', cell: cell('i2') },
        { type: 'pop', structureId: 's' },
      ]),
    );
    expect(elementIds(next, 's')).toEqual(['i0', 'i1']);
  });

  it('returns the same Scene for no events', () => {
    expect(unwrap(applyStepEvents(base, []))).toBe(base);
  });

  it('stops at and returns the first error', () => {
    const first: StepEvent = { type: 'pop', structureId: 'zzz' };
    const second: StepEvent = { type: 'pop', structureId: 'yyy' };
    const error = errorOf(applyStepEvents(base, [{ type: 'clear-highlights' }, first, second]));
    expect(error).toMatchObject({ code: 'unknown-structure', structureId: 'zzz' });
    expect(error.event).toBe(first);
  });

  it('later events see the effect of earlier ones', () => {
    const error = errorOf(
      applyStepEvents(base, [
        { type: 'remove', structureId: 's' },
        { type: 'push', structureId: 's', cell: cell('i1') },
      ]),
    );
    expect(error.code).toBe('unknown-structure');
  });
});

describe('scenesOf', () => {
  const step = (id: string, events: readonly StepEvent[]): Step => ({
    id,
    kind: 'explain',
    events,
  });
  const lesson = (steps: readonly Step[]): Lesson =>
    deepFreeze({ slug: 'demo', outcomes: [], initialScene: base, steps });

  it('returns one Scene per Step, each cumulative from the initialScene', () => {
    const scenes = unwrap(
      scenesOf(
        lesson([
          step('s0', [{ type: 'push', structureId: 's', cell: cell('i1') }]),
          step('s1', []),
          step('s2', [{ type: 'push', structureId: 's', cell: cell('i2') }]),
        ]),
      ),
    );
    expect(scenes.map((scene) => elementIds(scene, 's'))).toEqual([
      ['i0', 'i1'],
      ['i0', 'i1'],
      ['i0', 'i1', 'i2'],
    ]);
  });

  it('returns no Scenes for a Lesson without Steps', () => {
    expect(unwrap(scenesOf(lesson([])))).toEqual([]);
  });

  it('propagates the first error', () => {
    const result = scenesOf(
      lesson([
        step('s0', []),
        step('s1', [{ type: 'pop', structureId: 'zzz' }]),
        step('s2', [{ type: 'pop', structureId: 'yyy' }]),
      ]),
    );
    expect(errorOf(result)).toMatchObject({
      code: 'unknown-structure',
      structureId: 'zzz',
    });
  });
});
