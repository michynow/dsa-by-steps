import type { JsonValue, Result, ShapedValue } from '@/domain';
import { err, isJsonValue, ok } from '@/domain';

export const maxListNodes = 100_000;

export class ListNode {
  readonly val: unknown;
  next: ListNode | null;

  constructor(val: unknown, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

interface NodeLike {
  readonly val: unknown;
  readonly next: unknown;
}

function isNodeLike(value: unknown): value is NodeLike {
  return typeof value === 'object' && value !== null && 'val' in value && 'next' in value;
}

export function toListNodes(items: readonly JsonValue[]): ListNode | null {
  return items.reduceRight<ListNode | null>((next, val) => new ListNode(val, next), null);
}

export function toArgument(shaped: ShapedValue): unknown {
  if (shaped.shape === 'value') return structuredClone(shaped.value);
  return Array.isArray(shaped.value) ? toListNodes(shaped.value) : null;
}

export function listToArray(head: unknown): Result<readonly JsonValue[], string> {
  const seen = new Set<unknown>();
  const items: JsonValue[] = [];
  let cursor = head;
  while (cursor !== null) {
    if (!isNodeLike(cursor)) return err('Returned a value that is not a linked list');
    if (seen.has(cursor)) return err('Returned list contains a cycle');
    if (items.length === maxListNodes) {
      return err(`Returned list is longer than ${String(maxListNodes)} nodes`);
    }
    if (!isJsonValue(cursor.val)) return err('Returned list holds a value that is not JSON');
    seen.add(cursor);
    items.push(cursor.val);
    cursor = cursor.next;
  }
  return ok(items);
}

export function toShaped(
  actual: unknown,
  shape: ShapedValue['shape'],
): Result<ShapedValue, string> {
  if (shape === 'value') {
    return isJsonValue(actual)
      ? ok({ shape, value: actual })
      : err('Returned a value that is not JSON');
  }
  const items = listToArray(actual);
  return items.ok ? ok({ shape, value: items.value }) : items;
}

function normalized(shaped: ShapedValue): JsonValue {
  return shaped.shape === 'linked-list' && shaped.value === null ? [] : shaped.value;
}

type Entries = ArrayLike<JsonValue> | Readonly<Record<string, JsonValue>>;

function equalEntries(a: Entries, b: Entries): boolean {
  const other = new Map(Object.entries(b));
  const entries = Object.entries(a);
  return (
    entries.length === other.size &&
    entries.every(([key, item]) => {
      const counterpart = other.get(key);
      return counterpart !== undefined && deepEqual(item, counterpart);
    })
  );
}

export function deepEqual(a: JsonValue, b: JsonValue): boolean {
  if (typeof a === 'object' && a !== null) {
    return (
      typeof b === 'object' &&
      b !== null &&
      Array.isArray(a) === Array.isArray(b) &&
      equalEntries(a, b)
    );
  }
  return a === b;
}

export function shapedEqual(a: ShapedValue, b: ShapedValue): boolean {
  return a.shape === b.shape && deepEqual(normalized(a), normalized(b));
}
