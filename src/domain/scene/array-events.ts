import { err, ok } from '../result';
import {
  dropElementReferences,
  expectKind,
  isArray,
  replaceStructure,
  requireElement,
  requireNewElement,
  unknownElement,
} from './scene-access';
import type { EventOf, Reduction } from './scene-access';
import type { Scene } from './types';

export function applySwap(scene: Scene, event: EventOf<'swap'>): Reduction {
  const array = expectKind(scene, event, event.structureId, isArray);
  if (!array.ok) return array;
  const { cells } = array.value;
  const cellA = cells.find((cell) => cell.id === event.a);
  if (cellA === undefined) return unknownElement(event, event.structureId, event.a);
  const cellB = cells.find((cell) => cell.id === event.b);
  if (cellB === undefined) return unknownElement(event, event.structureId, event.b);
  const swapped = cells.map((cell) => {
    if (cell.id === event.a) return cellB;
    if (cell.id === event.b) return cellA;
    return cell;
  });
  return ok(replaceStructure(scene, { ...array.value, cells: swapped }));
}

export function applyInsertCell(scene: Scene, event: EventOf<'insert-cell'>): Reduction {
  const array = expectKind(scene, event, event.structureId, isArray);
  if (!array.ok) return array;
  const { cells } = array.value;
  if (!Number.isInteger(event.index) || event.index < 0 || event.index > cells.length) {
    return err({
      code: 'index-out-of-range',
      event,
      structureId: event.structureId,
      index: event.index,
    });
  }
  const fresh = requireNewElement(array.value, event, event.cell.id);
  if (!fresh.ok) return fresh;
  const next = [...cells.slice(0, event.index), event.cell, ...cells.slice(event.index)];
  return ok(replaceStructure(scene, { ...array.value, cells: next }));
}

export function applyRemoveCell(scene: Scene, event: EventOf<'remove-cell'>): Reduction {
  const { structureId, elementId } = event.target;
  const array = expectKind(scene, event, structureId, isArray);
  if (!array.ok) return array;
  const present = requireElement(array.value, event, elementId);
  if (!present.ok) return present;
  const cells = array.value.cells.filter((cell) => cell.id !== elementId);
  return ok(
    dropElementReferences(
      replaceStructure(scene, { ...array.value, cells }),
      structureId,
      elementId,
    ),
  );
}
