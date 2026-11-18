import { err, ok } from '../result';
import {
  dropElementReferences,
  expectKind,
  isQueue,
  isStack,
  replaceStructure,
  requireNewElement,
} from './scene-access';
import type { EventOf, KindGuard, Reduction } from './scene-access';
import type { Cell, Scene, StepEvent, Structure, StructureId } from './types';

type Sequence = Extract<Structure, { kind: 'stack' | 'queue' }>;

function append<S extends Sequence>(
  scene: Scene,
  event: StepEvent,
  structureId: StructureId,
  cell: Cell,
  guard: KindGuard<S>,
): Reduction {
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

function takeFrom<S extends Sequence>(
  scene: Scene,
  event: StepEvent,
  structureId: StructureId,
  guard: KindGuard<S>,
  position: 'first' | 'last',
): Reduction {
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

export function applyPush(scene: Scene, event: EventOf<'push'>): Reduction {
  return append(scene, event, event.structureId, event.cell, isStack);
}

export function applyPop(scene: Scene, event: EventOf<'pop'>): Reduction {
  return takeFrom(scene, event, event.structureId, isStack, 'last');
}

export function applyEnqueue(scene: Scene, event: EventOf<'enqueue'>): Reduction {
  return append(scene, event, event.structureId, event.cell, isQueue);
}

export function applyDequeue(scene: Scene, event: EventOf<'dequeue'>): Reduction {
  return takeFrom(scene, event, event.structureId, isQueue, 'first');
}
