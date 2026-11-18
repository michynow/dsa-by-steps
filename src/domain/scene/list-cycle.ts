import { err, ok } from '../result';
import type { Result } from '../result';
import type { ElementId, SceneError, StepEvent, Structure } from './types';

type LinkedList = Extract<Structure, { kind: 'linked-list' }>;

function walk(
  nextOf: ReadonlyMap<ElementId, ElementId | null>,
  from: ElementId | null,
  budget: number,
): boolean {
  if (from === null) return false;
  if (budget === 0) return true;
  return walk(nextOf, nextOf.get(from) ?? null, budget - 1);
}

function hasCycle(list: LinkedList): boolean {
  const nextOf = new Map(list.nodes.map((node) => [node.id, node.next]));
  return list.nodes.some((node) => walk(nextOf, node.id, list.nodes.length));
}

export function requireAcyclic(list: LinkedList, event: StepEvent): Result<null, SceneError> {
  return hasCycle(list) ? err({ code: 'cycle', event, structureId: list.id }) : ok(null);
}
