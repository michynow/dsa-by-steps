import type { JsonValue, ShapedValue, TestCase } from '@/domain';

function literalOf(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(literalOf).join(', ')}]`;
  if (value !== null && typeof value === 'object') {
    const fields = Object.entries(value).map(([key, field]) => `${key}: ${literalOf(field)}`);
    return fields.length === 0 ? '{}' : `{ ${fields.join(', ')} }`;
  }
  return JSON.stringify(value);
}

function shapedLiteral(shaped: ShapedValue): string {
  if (shaped.shape === 'value' || !Array.isArray(shaped.value)) return literalOf(shaped.value);
  return [...shaped.value.map(literalOf), 'null'].join(' -> ');
}

export function exampleCall(functionName: string, test: TestCase): string {
  const args = test.args.map(shapedLiteral).join(', ');
  return `${functionName}(${args}); // → ${shapedLiteral(test.expected)}`;
}
