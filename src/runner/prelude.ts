import type { Exercise, JsonValue, ShapedValue } from '@/domain';

function listShapes(exercise: Exercise): readonly ShapedValue[] {
  return [...exercise.visibleTests, ...exercise.hiddenTests]
    .flatMap((test) => [...test.args, test.expected])
    .filter((shaped) => shaped.shape === 'linked-list');
}

function usesLinkedList(exercise: Exercise): boolean {
  const generator = exercise.complexityTest?.generator;
  return listShapes(exercise).length > 0 || generator?.kind === 'linked-list-range';
}

function holdsStrings(value: JsonValue): boolean {
  return JSON.stringify(value).includes('"');
}

function valueType(exercise: Exercise): 'number' | 'string' {
  return listShapes(exercise).some((shaped) => holdsStrings(shaped.value)) ? 'string' : 'number';
}

function listNodeSource(type: string): string {
  return [
    'class ListNode {',
    `  val: ${type};`,
    '  next: ListNode | null;',
    `  constructor(val: ${type}, next: ListNode | null = null) {`,
    '    this.val = val;',
    '    this.next = next;',
    '  }',
    '}',
    '',
  ].join('\n');
}

export function preludeFor(exercise: Exercise): string {
  return usesLinkedList(exercise) ? listNodeSource(valueType(exercise)) : '';
}
