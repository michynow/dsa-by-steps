import { assertNever } from '../assert-never';
import type { Lesson } from '../course/types';
import { ok } from '../result';
import type { Result } from '../result';
import {
  applyClearHighlights,
  applyDropPointer,
  applyHighlight,
  applyMovePointer,
  applyPoint,
} from './annotation-events';
import { applyInsertCell, applyRemoveCell, applySwap } from './array-events';
import { applyAddNode, applyLink, applyRemoveNode, applySetHead } from './list-events';
import { applyPutEntry, applyRemoveEntry } from './map-events';
import { isQueue, isStack } from './scene-access';
import type { EventOf, Reduction } from './scene-access';
import { appendItem, takeItem } from './sequence-events';
import { applyCreate, applyRemove, applySetValue } from './structure-events';
import type { Scene, SceneError, StepEvent, StepEventType } from './types';

type EventGroup = 'structure' | 'array' | 'list' | 'sequence' | 'map' | 'annotation';

const groupOf: Readonly<Record<StepEventType, EventGroup>> = {
  create: 'structure',
  remove: 'structure',
  'set-value': 'structure',
  swap: 'array',
  'insert-cell': 'array',
  'remove-cell': 'array',
  'add-node': 'list',
  'remove-node': 'list',
  link: 'list',
  'set-head': 'list',
  push: 'sequence',
  pop: 'sequence',
  enqueue: 'sequence',
  dequeue: 'sequence',
  'put-entry': 'map',
  'remove-entry': 'map',
  point: 'annotation',
  'move-pointer': 'annotation',
  'drop-pointer': 'annotation',
  highlight: 'annotation',
  'clear-highlights': 'annotation',
};

type StructureEvent = EventOf<'create' | 'remove' | 'set-value'>;
type ArrayEvent = EventOf<'swap' | 'insert-cell' | 'remove-cell'>;
type ListEvent = EventOf<'add-node' | 'remove-node' | 'link' | 'set-head'>;
type SequenceEvent = EventOf<'push' | 'pop' | 'enqueue' | 'dequeue'>;
type MapEvent = EventOf<'put-entry' | 'remove-entry'>;
type AnnotationEvent = EventOf<
  'point' | 'move-pointer' | 'drop-pointer' | 'highlight' | 'clear-highlights'
>;

const inGroup = (event: StepEvent, group: EventGroup): boolean => groupOf[event.type] === group;

function applyStructureEvent(scene: Scene, event: StructureEvent): Reduction {
  switch (event.type) {
    case 'create':
      return applyCreate(scene, event);
    case 'remove':
      return applyRemove(scene, event);
    case 'set-value':
      return applySetValue(scene, event);
    default:
      return assertNever(event);
  }
}

function applyArrayEvent(scene: Scene, event: ArrayEvent): Reduction {
  switch (event.type) {
    case 'swap':
      return applySwap(scene, event);
    case 'insert-cell':
      return applyInsertCell(scene, event);
    case 'remove-cell':
      return applyRemoveCell(scene, event);
    default:
      return assertNever(event);
  }
}

function applyListEvent(scene: Scene, event: ListEvent): Reduction {
  switch (event.type) {
    case 'add-node':
      return applyAddNode(scene, event);
    case 'remove-node':
      return applyRemoveNode(scene, event);
    case 'link':
      return applyLink(scene, event);
    case 'set-head':
      return applySetHead(scene, event);
    default:
      return assertNever(event);
  }
}

function applySequenceEvent(scene: Scene, event: SequenceEvent): Reduction {
  switch (event.type) {
    case 'push':
      return appendItem(scene, event, isStack);
    case 'pop':
      return takeItem(scene, event, isStack, 'last');
    case 'enqueue':
      return appendItem(scene, event, isQueue);
    case 'dequeue':
      return takeItem(scene, event, isQueue, 'first');
    default:
      return assertNever(event);
  }
}

function applyMapEvent(scene: Scene, event: MapEvent): Reduction {
  switch (event.type) {
    case 'put-entry':
      return applyPutEntry(scene, event);
    case 'remove-entry':
      return applyRemoveEntry(scene, event);
    default:
      return assertNever(event);
  }
}

function applyAnnotationEvent(scene: Scene, event: AnnotationEvent): Reduction {
  switch (event.type) {
    case 'point':
      return applyPoint(scene, event);
    case 'move-pointer':
      return applyMovePointer(scene, event);
    case 'drop-pointer':
      return applyDropPointer(scene, event);
    case 'highlight':
      return applyHighlight(scene, event);
    case 'clear-highlights':
      return applyClearHighlights(scene);
    default:
      return assertNever(event);
  }
}

function isStructureEvent(event: StepEvent): event is StructureEvent {
  return inGroup(event, 'structure');
}
function isArrayEvent(event: StepEvent): event is ArrayEvent {
  return inGroup(event, 'array');
}
function isListEvent(event: StepEvent): event is ListEvent {
  return inGroup(event, 'list');
}
function isSequenceEvent(event: StepEvent): event is SequenceEvent {
  return inGroup(event, 'sequence');
}
function isMapEvent(event: StepEvent): event is MapEvent {
  return inGroup(event, 'map');
}
function isAnnotationEvent(event: StepEvent): event is AnnotationEvent {
  return inGroup(event, 'annotation');
}

export function applyStepEvent(scene: Scene, event: StepEvent): Reduction {
  if (isStructureEvent(event)) return applyStructureEvent(scene, event);
  if (isArrayEvent(event)) return applyArrayEvent(scene, event);
  if (isListEvent(event)) return applyListEvent(scene, event);
  if (isSequenceEvent(event)) return applySequenceEvent(scene, event);
  if (isMapEvent(event)) return applyMapEvent(scene, event);
  if (isAnnotationEvent(event)) return applyAnnotationEvent(scene, event);
  return assertNever(event);
}

export function applyStepEvents(scene: Scene, events: readonly StepEvent[]): Reduction {
  return events.reduce<Reduction>(
    (current, event) => (current.ok ? applyStepEvent(current.value, event) : current),
    ok(scene),
  );
}

export function framesOf(
  scene: Scene,
  events: readonly StepEvent[],
): Result<readonly Scene[], SceneError> {
  const start: Result<readonly Scene[], SceneError> = ok([scene]);
  return events.reduce((acc, event) => {
    if (!acc.ok) return acc;
    const next = applyStepEvent(acc.value.at(-1) ?? scene, event);
    return next.ok ? ok([...acc.value, next.value]) : next;
  }, start);
}

export function scenesOf(lesson: Lesson): Result<readonly Scene[], SceneError> {
  const initial: Result<readonly Scene[], SceneError> = ok([]);
  return lesson.steps.reduce((acc, step) => {
    if (!acc.ok) return acc;
    const previous = acc.value[acc.value.length - 1] ?? lesson.initialScene;
    const next = applyStepEvents(previous, step.events);
    return next.ok ? ok([...acc.value, next.value]) : next;
  }, initial);
}
