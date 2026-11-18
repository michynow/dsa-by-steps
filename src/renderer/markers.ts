import { elementIdsOf } from '@/domain';
import { keyOf } from './keys';
import type { ElementId, Scene, Structure } from '@/domain';

export type StructureTag = 'head' | 'front' | 'back';

export type Marker =
  | { readonly kind: 'tag'; readonly key: string; readonly tag: StructureTag }
  | { readonly kind: 'pointer'; readonly key: string; readonly label: string };

export type MarkerMap = ReadonlyMap<ElementId, readonly Marker[]>;

function structureTags(structure: Structure): readonly (readonly [ElementId, StructureTag])[] {
  switch (structure.kind) {
    case 'linked-list':
      return structure.head === null ? [] : [[structure.head, 'head']];
    case 'queue': {
      const first = structure.items[0];
      const last = structure.items[structure.items.length - 1];
      return [
        ...(first === undefined ? [] : [[first.id, 'front'] as const]),
        ...(last === undefined ? [] : [[last.id, 'back'] as const]),
      ];
    }
    case 'array':
    case 'stack':
    case 'hash-map':
      return [];
  }
}

export function markersAbove(scene: Scene, structure: Structure): MarkerMap {
  const present = new Set(elementIdsOf(structure));
  const markers = new Map<ElementId, Marker[]>();
  const add = (elementId: ElementId, marker: Marker): void => {
    if (present.has(elementId)) markers.set(elementId, [...(markers.get(elementId) ?? []), marker]);
  };
  structureTags(structure).forEach(([elementId, tag]) => {
    add(elementId, { kind: 'tag', key: keyOf('tag', structure.id, tag), tag });
  });
  scene.pointers.forEach((pointer) => {
    if (pointer.target?.structureId === structure.id) {
      add(pointer.target.elementId, {
        kind: 'pointer',
        key: keyOf('pointer', pointer.id),
        label: pointer.label,
      });
    }
  });
  return markers;
}

export function tallestStack(markers: MarkerMap): number {
  return Math.max(0, ...[...markers.values()].map((stack) => stack.length));
}
