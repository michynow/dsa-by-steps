import type { JsonValue, ShapedValue } from '@/domain';

function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isDense(items: readonly unknown[]): boolean {
  return Object.keys(items).length === items.length;
}

export function isStrictJson(value: unknown): value is JsonValue {
  if (Array.isArray(value)) return isDense(value) && value.every(isStrictJson);
  if (typeof value === 'object' && value !== null) {
    return isPlainObject(value) && Object.values(value).every(isStrictJson);
  }
  if (typeof value === 'number') return Number.isFinite(value);
  return value === null || typeof value === 'boolean' || typeof value === 'string';
}

export function hasListShape(shaped: ShapedValue): boolean {
  return shaped.shape === 'value' || shaped.value === null || Array.isArray(shaped.value);
}
