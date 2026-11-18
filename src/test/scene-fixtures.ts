import { elementIdsOf } from '@/domain';
import type { Result } from '@/domain';
import type {
  Cell,
  ElementRef,
  Entry,
  Highlight,
  ListNode,
  Pointer,
  Scene,
  SceneError,
  Structure,
} from '@/domain';

export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

export const cell = (id: string, value: Cell['value'] = id): Cell => ({
  id,
  value,
});

export const node = (
  id: string,
  next: string | null = null,
  value: ListNode['value'] = id,
): ListNode => ({ id, value, next });

export const entry = (id: string, key: Entry['key'], value: Entry['value'] = id): Entry => ({
  id,
  key,
  value,
});

export const arrayOf = (id: string, ...ids: string[]): Structure => ({
  kind: 'array',
  id,
  cells: ids.map((cellId) => cell(cellId)),
});

export const stackOf = (id: string, ...ids: string[]): Structure => ({
  kind: 'stack',
  id,
  items: ids.map((itemId) => cell(itemId)),
});

export const queueOf = (id: string, ...ids: string[]): Structure => ({
  kind: 'queue',
  id,
  items: ids.map((itemId) => cell(itemId)),
});

export const listOf = (id: string, head: string | null, ...nodes: ListNode[]): Structure => ({
  kind: 'linked-list',
  id,
  nodes,
  head,
});

export const mapOf = (id: string, ...buckets: readonly (readonly Entry[])[]): Structure => ({
  kind: 'hash-map',
  id,
  buckets,
});

export const sceneOf = (
  structures: readonly Structure[],
  pointers: readonly Pointer[] = [],
  highlights: readonly Highlight[] = [],
): Scene => deepFreeze({ structures, pointers, highlights });

export const ref = (structureId: string, elementId: string): ElementRef => ({
  structureId,
  elementId,
});

export function unwrap<T>(result: Result<T, SceneError>): T {
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}`);
  return result.value;
}

export function errorOf(result: Result<unknown, SceneError>): SceneError {
  if (result.ok) throw new Error('expected an error');
  return result.error;
}

export function elementIds(scene: Scene, structureId: string): readonly string[] {
  const structure = scene.structures.find((s) => s.id === structureId);
  return structure === undefined ? [] : elementIdsOf(structure);
}
