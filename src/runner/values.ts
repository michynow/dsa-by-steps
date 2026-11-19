import type { JsonValue, Result, ShapedValue } from '@/domain';
import { err, ok } from '@/domain';
import { intrinsics } from './intrinsics';

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

function isPlainObject(value: object): boolean {
  const prototype: unknown = intrinsics.getPrototypeOf(value);
  return prototype === intrinsics.objectPrototype || prototype === null;
}

function isDense(items: readonly unknown[]): boolean {
  return intrinsics.keys(items).length === items.length;
}

function everyJson(items: readonly unknown[]): boolean {
  for (const item of items) {
    if (!isJson(item)) return false;
  }
  return true;
}

function isJsonObject(value: object): boolean {
  if (!isPlainObject(value)) return false;
  for (const [, item] of intrinsics.entries(value)) {
    if (!isJson(item)) return false;
  }
  return true;
}

export function isJson(value: unknown): value is JsonValue {
  if (intrinsics.isArray(value)) return isDense(value) && everyJson(value);
  if (typeof value === 'object' && value !== null) return isJsonObject(value);
  if (typeof value === 'number') return intrinsics.isFinite(value);
  return value === null || typeof value === 'boolean' || typeof value === 'string';
}

export function toListNodes(items: readonly JsonValue[]): ListNode | null {
  let head: ListNode | null = null;
  for (let index = items.length - 1; index >= 0; index -= 1) {
    head = new ListNode(items[index], head);
  }
  return head;
}

export function toArgument(shaped: ShapedValue): unknown {
  if (shaped.shape === 'value') return intrinsics.clone(shaped.value);
  return intrinsics.isArray(shaped.value) ? toListNodes(shaped.value) : null;
}

export function listToArray(head: unknown): Result<readonly JsonValue[], string> {
  const seen = new intrinsics.Set<unknown>();
  const items: JsonValue[] = [];
  let cursor = head;
  while (cursor !== null) {
    if (!isNodeLike(cursor)) return err('Returned a value that is not a linked list');
    if (seen.has(cursor)) return err('Returned list contains a cycle');
    if (items.length === maxListNodes) {
      return err(`Returned list is longer than ${String(maxListNodes)} nodes`);
    }
    if (!isJson(cursor.val)) return err('Returned list holds a value that is not JSON');
    seen.add(cursor);
    items[items.length] = cursor.val;
    cursor = cursor.next;
  }
  return ok(items);
}

export function toShaped(
  actual: unknown,
  shape: ShapedValue['shape'],
): Result<ShapedValue, string> {
  if (shape === 'value') {
    return isJson(actual) ? ok({ shape, value: actual }) : err('Returned a value that is not JSON');
  }
  const items = listToArray(actual);
  return items.ok ? ok({ shape, value: items.value }) : items;
}

function normalized(shaped: ShapedValue): JsonValue {
  return shaped.shape === 'linked-list' && shaped.value === null ? [] : shaped.value;
}

type Entries = ArrayLike<JsonValue> | Readonly<Record<string, JsonValue>>;

function equalEntries(a: Entries, b: Entries): boolean {
  const other = new intrinsics.Map(intrinsics.entries(b));
  const entries = intrinsics.entries(a);
  if (entries.length !== other.size) return false;
  for (const [key, item] of entries) {
    const counterpart = other.get(key);
    if (counterpart === undefined || !deepEqual(item, counterpart)) return false;
  }
  return true;
}

export function deepEqual(a: JsonValue, b: JsonValue): boolean {
  if (typeof a === 'object' && a !== null) {
    return (
      typeof b === 'object' &&
      b !== null &&
      intrinsics.isArray(a) === intrinsics.isArray(b) &&
      equalEntries(a, b)
    );
  }
  return a === b;
}

export function shapedEqual(a: ShapedValue, b: ShapedValue): boolean {
  return a.shape === b.shape && deepEqual(normalized(a), normalized(b));
}
