import { err, ok } from '../result';
import type { Result } from '../result';
import type {
  ElementId,
  ElementRef,
  Scene,
  SceneError,
  StepEvent,
  Structure,
  StructureId,
} from './types';

export type Reduction = Result<Scene, SceneError>;
export type EventOf<T extends StepEvent['type']> = Extract<StepEvent, { readonly type: T }>;
export type KindGuard<S extends Structure> = (structure: Structure) => structure is S;

export const isArray: KindGuard<Extract<Structure, { kind: 'array' }>> = (s) => s.kind === 'array';
export const isLinkedList: KindGuard<Extract<Structure, { kind: 'linked-list' }>> = (s) =>
  s.kind === 'linked-list';
export const isStack: KindGuard<Extract<Structure, { kind: 'stack' }>> = (s) => s.kind === 'stack';
export const isQueue: KindGuard<Extract<Structure, { kind: 'queue' }>> = (s) => s.kind === 'queue';
export const isHashMap: KindGuard<Extract<Structure, { kind: 'hash-map' }>> = (s) =>
  s.kind === 'hash-map';

export function elementIdsOf(structure: Structure): readonly ElementId[] {
  switch (structure.kind) {
    case 'array':
      return structure.cells.map((cell) => cell.id);
    case 'linked-list':
      return structure.nodes.map((node) => node.id);
    case 'stack':
    case 'queue':
      return structure.items.map((item) => item.id);
    case 'hash-map':
      return structure.buckets.flatMap((bucket) => bucket.map((entry) => entry.id));
  }
}

export function hasElement(structure: Structure, elementId: ElementId): boolean {
  return elementIdsOf(structure).includes(elementId);
}

export function findStructure(
  scene: Scene,
  event: StepEvent,
  structureId: StructureId,
): Result<Structure, SceneError> {
  const structure = scene.structures.find((s) => s.id === structureId);
  return structure === undefined
    ? err({ code: 'unknown-structure', event, structureId })
    : ok(structure);
}

export function expectKind<S extends Structure>(
  scene: Scene,
  event: StepEvent,
  structureId: StructureId,
  guard: KindGuard<S>,
): Result<S, SceneError> {
  const found = findStructure(scene, event, structureId);
  if (!found.ok) return found;
  return guard(found.value)
    ? ok(found.value)
    : err({
        code: 'wrong-kind',
        event,
        structureId,
        actual: found.value.kind,
      });
}

export function unknownElement(
  event: StepEvent,
  structureId: StructureId,
  elementId: ElementId,
): Result<never, SceneError> {
  return err({ code: 'unknown-element', event, structureId, elementId });
}

export function requireElement(
  structure: Structure,
  event: StepEvent,
  elementId: ElementId,
): Result<null, SceneError> {
  return hasElement(structure, elementId)
    ? ok(null)
    : unknownElement(event, structure.id, elementId);
}

export function requireNewElement(
  structure: Structure,
  event: StepEvent,
  elementId: ElementId,
): Result<null, SceneError> {
  return hasElement(structure, elementId)
    ? err({ code: 'duplicate-id', event, namespace: 'element', id: elementId })
    : ok(null);
}

export function requireElementOrNull(
  structure: Structure,
  event: StepEvent,
  elementId: ElementId | null,
): Result<null, SceneError> {
  return elementId === null ? ok(null) : requireElement(structure, event, elementId);
}

export function requireTarget(
  scene: Scene,
  event: StepEvent,
  target: ElementRef | null,
): Result<null, SceneError> {
  if (target === null) return ok(null);
  const structure = findStructure(scene, event, target.structureId);
  if (!structure.ok) return structure;
  return requireElement(structure.value, event, target.elementId);
}

export function replaceStructure(scene: Scene, replacement: Structure): Scene {
  return {
    ...scene,
    structures: scene.structures.map((s) => (s.id === replacement.id ? replacement : s)),
  };
}

export function dropReferences(scene: Scene, refersTo: (ref: ElementRef) => boolean): Scene {
  return {
    ...scene,
    pointers: scene.pointers.map((pointer) =>
      pointer.target !== null && refersTo(pointer.target) ? { ...pointer, target: null } : pointer,
    ),
    highlights: scene.highlights.filter((highlight) => !refersTo(highlight.target)),
  };
}

export function dropElementReferences(
  scene: Scene,
  structureId: StructureId,
  elementId: ElementId,
): Scene {
  return dropReferences(
    scene,
    (ref) => ref.structureId === structureId && ref.elementId === elementId,
  );
}
