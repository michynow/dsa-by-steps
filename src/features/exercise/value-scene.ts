import { isJsonValue } from '@/domain';
import type { JsonValue, Primitive, Scene } from '@/domain';

function primitiveOf(value: JsonValue): Primitive {
  if (value === null || typeof value !== 'object') return value;
  return JSON.stringify(value);
}

export function listScene(value: JsonValue): Scene {
  const items = Array.isArray(value) ? value.filter(isJsonValue) : [];
  const nodes = items.map((item, index) => ({
    id: `n${String(index)}`,
    value: primitiveOf(item),
    next: index + 1 < items.length ? `n${String(index + 1)}` : null,
  }));
  return {
    structures: [{ kind: 'linked-list', id: 'list', nodes, head: nodes[0]?.id ?? null }],
    pointers: [],
    highlights: [],
  };
}
