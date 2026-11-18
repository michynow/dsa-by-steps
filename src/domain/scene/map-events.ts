import { err, ok } from '../result';
import {
  dropElementReferences,
  expectKind,
  isHashMap,
  replaceStructure,
  requireElement,
  requireNewElement,
} from './scene-access';
import type { EventOf, Reduction } from './scene-access';
import type { Entry, Scene, Structure } from './types';

type HashMap = Extract<Structure, { kind: 'hash-map' }>;

function replacingBucket(map: HashMap, index: number, bucket: readonly Entry[]): HashMap {
  return {
    ...map,
    buckets: map.buckets.map((existing, i) => (i === index ? bucket : existing)),
  };
}

export function applyPutEntry(scene: Scene, event: EventOf<'put-entry'>): Reduction {
  const map = expectKind(scene, event, event.structureId, isHashMap);
  if (!map.ok) return map;
  const bucket = map.value.buckets[event.bucket];
  if (!Number.isInteger(event.bucket) || bucket === undefined) {
    return err({
      code: 'index-out-of-range',
      event,
      structureId: event.structureId,
      index: event.bucket,
    });
  }
  if (bucket.some((entry) => entry.key === event.entry.key)) {
    const updated = bucket.map((entry) =>
      entry.key === event.entry.key ? { ...entry, value: event.entry.value } : entry,
    );
    return ok(replaceStructure(scene, replacingBucket(map.value, event.bucket, updated)));
  }
  const fresh = requireNewElement(map.value, event, event.entry.id);
  if (!fresh.ok) return fresh;
  return ok(
    replaceStructure(scene, replacingBucket(map.value, event.bucket, [...bucket, event.entry])),
  );
}

export function applyRemoveEntry(scene: Scene, event: EventOf<'remove-entry'>): Reduction {
  const { structureId, elementId } = event.target;
  const map = expectKind(scene, event, structureId, isHashMap);
  if (!map.ok) return map;
  const present = requireElement(map.value, event, elementId);
  if (!present.ok) return present;
  const buckets = map.value.buckets.map((bucket) =>
    bucket.filter((entry) => entry.id !== elementId),
  );
  return ok(
    dropElementReferences(
      replaceStructure(scene, { ...map.value, buckets }),
      structureId,
      elementId,
    ),
  );
}
