import { err, ok } from '../result';
import {
  dropElementReferences,
  expectKind,
  replaceStructure,
  requireNewElement,
} from './scene-access';
import type { EventOf, KindGuard, Reduction } from './scene-access';
import type { Scene, Structure } from './types';

type Sequence = Extract<Structure, { kind: 'stack' | 'queue' }>;

export function appendItem<S extends Sequence>(
  scene: Scene,
  event: EventOf<'push' | 'enqueue'>,
  guard: KindGuard<S>,
): Reduction {
  const { cell, structureId } = event;
  const sequence = expectKind(scene, event, structureId, guard);
  if (!sequence.ok) return sequence;
  const fresh = requireNewElement(sequence.value, event, cell.id);
  if (!fresh.ok) return fresh;
  return ok(
    replaceStructure(scene, {
      ...sequence.value,
      items: [...sequence.value.items, cell],
    }),
  );
}

export function takeItem<S extends Sequence>(
  scene: Scene,
  event: EventOf<'pop' | 'dequeue'>,
  guard: KindGuard<S>,
  position: 'first' | 'last',
): Reduction {
  const { structureId } = event;
  const sequence = expectKind(scene, event, structureId, guard);
  if (!sequence.ok) return sequence;
  const { items } = sequence.value;
  const taken = position === 'first' ? items[0] : items[items.length - 1];
  if (taken === undefined) {
    return err({ code: 'empty-structure', event, structureId });
  }
  const remaining = items.filter((item) => item.id !== taken.id);
  return ok(
    dropElementReferences(
      replaceStructure(scene, { ...sequence.value, items: remaining }),
      structureId,
      taken.id,
    ),
  );
}
