import { err, ok } from '../result';
import type { Result } from '../result';
import { requireAcyclic } from './list-cycle';
import {
  dropReferences,
  elementIdsOf,
  findStructure,
  hasElement,
  isLinkedList,
  replaceStructure,
  requireElement,
  unknownElement,
} from './scene-access';
import type { EventOf, Reduction } from './scene-access';
import type { ElementId, Primitive, Scene, SceneError, StepEvent, Structure } from './types';

type LinkedList = Extract<Structure, { kind: 'linked-list' }>;

function firstDuplicate(ids: readonly string[]): string | undefined {
  return ids.find((id, index) => ids.indexOf(id) !== index);
}

function validateListLinks(list: LinkedList, event: StepEvent): Result<null, SceneError> {
  const references = [list.head, ...list.nodes.map((node) => node.next)];
  const missing = references.find((id) => id !== null && !hasElement(list, id));
  if (missing !== undefined && missing !== null) {
    return unknownElement(event, list.id, missing);
  }
  return requireAcyclic(list, event);
}

function validateStructure(structure: Structure, event: StepEvent): Result<null, SceneError> {
  const duplicate = firstDuplicate(elementIdsOf(structure));
  if (duplicate !== undefined) {
    return err({
      code: 'duplicate-id',
      event,
      namespace: 'element',
      id: duplicate,
    });
  }
  return isLinkedList(structure) ? validateListLinks(structure, event) : ok(null);
}

export function applyCreate(scene: Scene, event: EventOf<'create'>): Reduction {
  const { structure } = event;
  if (scene.structures.some((s) => s.id === structure.id)) {
    return err({
      code: 'duplicate-id',
      event,
      namespace: 'structure',
      id: structure.id,
    });
  }
  const valid = validateStructure(structure, event);
  if (!valid.ok) return valid;
  return ok({ ...scene, structures: [...scene.structures, structure] });
}

export function applyRemove(scene: Scene, event: EventOf<'remove'>): Reduction {
  const found = findStructure(scene, event, event.structureId);
  if (!found.ok) return found;
  const withoutStructure: Scene = {
    ...scene,
    structures: scene.structures.filter((s) => s.id !== event.structureId),
  };
  return ok(dropReferences(withoutStructure, (ref) => ref.structureId === event.structureId));
}

function withValue(structure: Structure, elementId: ElementId, value: Primitive): Structure {
  const update = <T extends { readonly id: ElementId }>(item: T): T =>
    item.id === elementId ? { ...item, value } : item;
  switch (structure.kind) {
    case 'array':
      return { ...structure, cells: structure.cells.map(update) };
    case 'linked-list':
      return { ...structure, nodes: structure.nodes.map(update) };
    case 'stack':
    case 'queue':
      return { ...structure, items: structure.items.map(update) };
    case 'hash-map':
      return {
        ...structure,
        buckets: structure.buckets.map((bucket) => bucket.map(update)),
      };
  }
}

export function applySetValue(scene: Scene, event: EventOf<'set-value'>): Reduction {
  const { target, value } = event;
  const found = findStructure(scene, event, target.structureId);
  if (!found.ok) return found;
  const present = requireElement(found.value, event, target.elementId);
  if (!present.ok) return present;
  return ok(replaceStructure(scene, withValue(found.value, target.elementId, value)));
}
