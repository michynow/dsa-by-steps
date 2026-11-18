import { ok } from '../result';
import { requireAcyclic } from './list-cycle';
import {
  dropElementReferences,
  expectKind,
  isLinkedList,
  replaceStructure,
  requireElement,
  requireElementOrNull,
  requireNewElement,
} from './scene-access';
import type { EventOf, Reduction } from './scene-access';
import type { ElementId, Scene, Structure } from './types';

type LinkedList = Extract<Structure, { kind: 'linked-list' }>;

export function applyAddNode(scene: Scene, event: EventOf<'add-node'>): Reduction {
  const list = expectKind(scene, event, event.structureId, isLinkedList);
  if (!list.ok) return list;
  const fresh = requireNewElement(list.value, event, event.node.id);
  if (!fresh.ok) return fresh;
  const next = requireElementOrNull(list.value, event, event.node.next);
  if (!next.ok) return next;
  return ok(
    replaceStructure(scene, {
      ...list.value,
      nodes: [...list.value.nodes, event.node],
    }),
  );
}

function unlinked(list: LinkedList, removed: ElementId): LinkedList {
  return {
    ...list,
    head: list.head === removed ? null : list.head,
    nodes: list.nodes
      .filter((node) => node.id !== removed)
      .map((node) => (node.next === removed ? { ...node, next: null } : node)),
  };
}

export function applyRemoveNode(scene: Scene, event: EventOf<'remove-node'>): Reduction {
  const { structureId, elementId } = event.target;
  const list = expectKind(scene, event, structureId, isLinkedList);
  if (!list.ok) return list;
  const present = requireElement(list.value, event, elementId);
  if (!present.ok) return present;
  return ok(
    dropElementReferences(
      replaceStructure(scene, unlinked(list.value, elementId)),
      structureId,
      elementId,
    ),
  );
}

export function applyLink(scene: Scene, event: EventOf<'link'>): Reduction {
  const list = expectKind(scene, event, event.structureId, isLinkedList);
  if (!list.ok) return list;
  const from = requireElement(list.value, event, event.from);
  if (!from.ok) return from;
  const to = requireElementOrNull(list.value, event, event.to);
  if (!to.ok) return to;
  const linked: LinkedList = {
    ...list.value,
    nodes: list.value.nodes.map((node) =>
      node.id === event.from ? { ...node, next: event.to } : node,
    ),
  };
  const acyclic = requireAcyclic(linked, event);
  if (!acyclic.ok) return acyclic;
  return ok(replaceStructure(scene, linked));
}

export function applySetHead(scene: Scene, event: EventOf<'set-head'>): Reduction {
  const list = expectKind(scene, event, event.structureId, isLinkedList);
  if (!list.ok) return list;
  const head = requireElementOrNull(list.value, event, event.head);
  if (!head.ok) return head;
  return ok(replaceStructure(scene, { ...list.value, head: event.head }));
}
