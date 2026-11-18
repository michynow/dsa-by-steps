import { assertNever, err, ok } from '@/domain';
import type {
  Answer,
  Check,
  CheckError,
  CourseError,
  ProgressError,
  Result,
  SceneError,
  StepEvent,
  Structure,
} from '@/domain';
import {
  currentProgressVersion,
  emptyProgress,
  emptyScene,
  initialCheckState,
  missesBeforeReveal,
} from '@/domain';

function structureKind(structure: Structure): string {
  switch (structure.kind) {
    case 'array':
    case 'linked-list':
    case 'stack':
    case 'queue':
    case 'hash-map':
      return structure.kind;
    default:
      return assertNever(structure);
  }
}

function structureKindMissingVariant(structure: Structure): string {
  if (structure.kind === 'array') {
    return structure.kind;
  }
  if (structure.kind === 'linked-list') {
    return structure.kind;
  }
  if (structure.kind === 'stack') {
    return structure.kind;
  }
  if (structure.kind === 'queue') {
    return structure.kind;
  }
  // @ts-expect-error hash-map is not handled
  return assertNever(structure);
}

function sceneErrorCode(error: SceneError): string {
  switch (error.code) {
    case 'unknown-structure':
    case 'unknown-element':
    case 'unknown-pointer':
    case 'duplicate-id':
    case 'wrong-kind':
    case 'empty-structure':
    case 'index-out-of-range':
    case 'cycle':
      return error.code;
    default:
      return assertNever(error);
  }
}

function sceneErrorCodeMissingVariant(error: SceneError): string {
  if (error.code === 'unknown-structure') {
    return error.code;
  }
  if (error.code === 'unknown-element') {
    return error.code;
  }
  if (error.code === 'unknown-pointer') {
    return error.code;
  }
  if (error.code === 'duplicate-id') {
    return error.code;
  }
  if (error.code === 'wrong-kind') {
    return error.code;
  }
  if (error.code === 'empty-structure') {
    return error.code;
  }
  if (error.code === 'index-out-of-range') {
    return error.code;
  }
  // @ts-expect-error cycle is not handled
  return assertNever(error);
}

type EventOf<T extends StepEvent['type']> = Extract<StepEvent, { type: T }>;
type StructureEvent = EventOf<'create' | 'remove' | 'swap' | 'set-value'>;
type SequenceEvent = EventOf<
  'insert-cell' | 'remove-cell' | 'push' | 'pop' | 'enqueue' | 'dequeue'
>;
type LinkEvent = EventOf<'add-node' | 'remove-node' | 'link' | 'set-head'>;
type EntryEvent = EventOf<'put-entry' | 'remove-entry'>;
type AnnotationEvent = EventOf<
  'point' | 'move-pointer' | 'drop-pointer' | 'highlight' | 'clear-highlights'
>;

function structureEventType(event: StructureEvent): string {
  switch (event.type) {
    case 'create':
    case 'remove':
    case 'swap':
    case 'set-value':
      return event.type;
    default:
      return assertNever(event);
  }
}

function sequenceEventType(event: SequenceEvent): string {
  switch (event.type) {
    case 'insert-cell':
    case 'remove-cell':
    case 'push':
    case 'pop':
    case 'enqueue':
    case 'dequeue':
      return event.type;
    default:
      return assertNever(event);
  }
}

function linkEventType(event: LinkEvent): string {
  switch (event.type) {
    case 'add-node':
    case 'remove-node':
    case 'link':
    case 'set-head':
      return event.type;
    default:
      return assertNever(event);
  }
}

function entryEventType(event: EntryEvent): string {
  switch (event.type) {
    case 'put-entry':
    case 'remove-entry':
      return event.type;
    default:
      return assertNever(event);
  }
}

function annotationEventType(event: AnnotationEvent): string {
  switch (event.type) {
    case 'point':
    case 'move-pointer':
    case 'drop-pointer':
    case 'highlight':
    case 'clear-highlights':
      return event.type;
    default:
      return assertNever(event);
  }
}

function stepEventTypeMissingVariant(event: StepEvent): string {
  if (event.type === 'create') {
    return structureEventType(event);
  }
  if (event.type === 'remove') {
    return structureEventType(event);
  }
  if (event.type === 'swap' || event.type === 'set-value') {
    return structureEventType(event);
  }
  if (event.type === 'push' || event.type === 'pop') {
    return sequenceEventType(event);
  }
  // @ts-expect-error the remaining variants are not handled
  return assertNever(event);
}

function checkKind(check: Check): string {
  switch (check.kind) {
    case 'predict':
    case 'choice':
    case 'order':
      return check.kind;
    default:
      return assertNever(check);
  }
}

function checkKindMissingVariant(check: Check): string {
  if (check.kind === 'predict') {
    return check.kind;
  }
  if (check.kind === 'choice') {
    return check.kind;
  }
  // @ts-expect-error order is not handled
  return assertNever(check);
}

function answerKind(answer: Answer): string {
  switch (answer.kind) {
    case 'predict':
    case 'choice':
    case 'order':
      return answer.kind;
    default:
      return assertNever(answer);
  }
}

function answerKindMissingVariant(answer: Answer): string {
  if (answer.kind === 'predict') {
    return answer.kind;
  }
  if (answer.kind === 'choice') {
    return answer.kind;
  }
  // @ts-expect-error order is not handled
  return assertNever(answer);
}

function checkErrorCode(error: CheckError): string {
  switch (error.code) {
    case 'answer-kind-mismatch':
    case 'reveal-unavailable':
    case 'already-settled':
      return error.code;
    default:
      return assertNever(error);
  }
}

function checkErrorCodeMissingVariant(error: CheckError): string {
  if (error.code === 'answer-kind-mismatch') {
    return error.code;
  }
  if (error.code === 'reveal-unavailable') {
    return error.code;
  }
  // @ts-expect-error already-settled is not handled
  return assertNever(error);
}

function courseErrorCode(error: CourseError): string {
  switch (error.code) {
    case 'unknown-module':
    case 'unknown-lesson':
    case 'step-out-of-range':
      return error.code;
    default:
      return assertNever(error);
  }
}

function courseErrorCodeMissingVariant(error: CourseError): string {
  if (error.code === 'unknown-module') {
    return error.code;
  }
  if (error.code === 'unknown-lesson') {
    return error.code;
  }
  // @ts-expect-error step-out-of-range is not handled
  return assertNever(error);
}

function progressErrorCode(error: ProgressError): string {
  switch (error.code) {
    case 'malformed':
    case 'unsupported-version':
      return error.code;
    default:
      return assertNever(error);
  }
}

function progressErrorCodeMissingVariant(error: ProgressError): string {
  if (error.code === 'malformed') {
    return error.code;
  }
  // @ts-expect-error unsupported-version is not handled
  return assertNever(error);
}

describe('exhaustive switches over discriminated unions', () => {
  it('compile when every variant is handled and fail when one is missing', () => {
    const structure: Structure = { kind: 'array', id: 'a', cells: [] };
    expect(structureKind(structure)).toBe('array');
    expect(() => structureKindMissingVariant({ kind: 'hash-map', id: 'm', buckets: [] })).toThrow();

    const clear: StepEvent = { type: 'clear-highlights' };
    expectTypeOf<
      StructureEvent | SequenceEvent | LinkEvent | EntryEvent | AnnotationEvent
    >().toEqualTypeOf<StepEvent>();
    expect(annotationEventType(clear)).toBe('clear-highlights');
    expect(structureEventType({ type: 'remove', structureId: 's' })).toBe('remove');
    expect(sequenceEventType({ type: 'pop', structureId: 's' })).toBe('pop');
    expect(linkEventType({ type: 'set-head', structureId: 's', head: null })).toBe('set-head');
    expect(
      entryEventType({ type: 'remove-entry', target: { structureId: 's', elementId: 'e' } }),
    ).toBe('remove-entry');
    expect(() => stepEventTypeMissingVariant(clear)).toThrow();

    const cycle: SceneError = { code: 'cycle', event: clear, structureId: 's' };
    expect(sceneErrorCode(cycle)).toBe('cycle');
    expect(() => sceneErrorCodeMissingVariant(cycle)).toThrow();

    const order: Check = {
      kind: 'order',
      id: 'c',
      structureId: 's',
      correct: [],
    };
    expect(checkKind(order)).toBe('order');
    expect(() => checkKindMissingVariant(order)).toThrow();

    const answer: Answer = { kind: 'order', sequence: [] };
    expect(answerKind(answer)).toBe('order');
    expect(() => answerKindMissingVariant(answer)).toThrow();

    const settled: CheckError = { code: 'already-settled', status: 'passed' };
    expect(checkErrorCode(settled)).toBe('already-settled');
    expect(() => checkErrorCodeMissingVariant(settled)).toThrow();

    const range: CourseError = { code: 'step-out-of-range', step: 9 };
    expect(courseErrorCode(range)).toBe('step-out-of-range');
    expect(() => courseErrorCodeMissingVariant(range)).toThrow();

    const version: ProgressError = { code: 'unsupported-version', version: 2 };
    expect(progressErrorCode(version)).toBe('unsupported-version');
    expect(() => progressErrorCodeMissingVariant(version)).toThrow();
  });
});

describe('Result', () => {
  it('ok and err build narrowable results', () => {
    expectTypeOf(ok(1)).toEqualTypeOf<Result<number, never>>();
    expectTypeOf(err('x')).toEqualTypeOf<Result<never, string>>();

    const result = ok(1) as Result<number, string>;
    if (result.ok) {
      expectTypeOf(result.value).toBeNumber();
    } else {
      expectTypeOf(result.error).toBeString();
    }
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err('x')).toEqual({ ok: false, error: 'x' });
  });
});

describe('constants', () => {
  it('match their types and are readonly', () => {
    expect(emptyScene).toEqual({
      structures: [],
      pointers: [],
      highlights: [],
    });
    expect(initialCheckState).toEqual({ misses: 0, status: 'open' });
    expect(missesBeforeReveal).toBe(3);
    expect(currentProgressVersion).toBe(1);
    expect(emptyProgress).toEqual({
      version: 1,
      stepsSeen: {},
      checks: {},
      exercises: {},
    });
  });

  it('reject mutation at the type level', () => {
    const mutations = [
      () => {
        // @ts-expect-error structures is readonly
        emptyScene.structures = [];
      },
      () => {
        // @ts-expect-error misses is readonly
        initialCheckState.misses = 1;
      },
      () => {
        // @ts-expect-error stepsSeen is a readonly record
        emptyProgress.stepsSeen['m/l'] = [];
      },
    ];
    expect(mutations).toHaveLength(3);
  });
});
