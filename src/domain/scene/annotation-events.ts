import { err, ok } from '../result';
import { requireTarget, sameRef } from './scene-access';
import type { EventOf, Reduction } from './scene-access';
import type { Pointer, Scene } from './types';

export function applyPoint(scene: Scene, event: EventOf<'point'>): Reduction {
  const { pointer } = event;
  if (scene.pointers.some((existing) => existing.id === pointer.id)) {
    return err({
      code: 'duplicate-id',
      event,
      namespace: 'pointer',
      id: pointer.id,
    });
  }
  const target = requireTarget(scene, event, pointer.target);
  if (!target.ok) return target;
  return ok({ ...scene, pointers: [...scene.pointers, pointer] });
}

export function applyMovePointer(scene: Scene, event: EventOf<'move-pointer'>): Reduction {
  if (!scene.pointers.some((pointer) => pointer.id === event.pointerId)) {
    return err({ code: 'unknown-pointer', event, pointerId: event.pointerId });
  }
  const target = requireTarget(scene, event, event.target);
  if (!target.ok) return target;
  const move = (pointer: Pointer): Pointer =>
    pointer.id === event.pointerId ? { ...pointer, target: event.target } : pointer;
  return ok({ ...scene, pointers: scene.pointers.map(move) });
}

export function applyDropPointer(scene: Scene, event: EventOf<'drop-pointer'>): Reduction {
  if (!scene.pointers.some((pointer) => pointer.id === event.pointerId)) {
    return err({ code: 'unknown-pointer', event, pointerId: event.pointerId });
  }
  return ok({
    ...scene,
    pointers: scene.pointers.filter((pointer) => pointer.id !== event.pointerId),
  });
}

export function applyHighlight(scene: Scene, event: EventOf<'highlight'>): Reduction {
  const { highlight } = event;
  const target = requireTarget(scene, event, highlight.target);
  if (!target.ok) return target;
  const others = scene.highlights.filter((existing) => !sameRef(existing.target, highlight.target));
  return ok({ ...scene, highlights: [...others, highlight] });
}

export function applyClearHighlights(scene: Scene): Reduction {
  return ok({ ...scene, highlights: [] });
}
