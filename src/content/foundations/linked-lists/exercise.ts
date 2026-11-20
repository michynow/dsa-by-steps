import type { Exercise, TestCase } from '@/domain';

const reverseOf = (
  id: string,
  spots: readonly string[] | null,
  reversed: readonly string[] | null,
): TestCase => ({
  id,
  args: [{ shape: 'linked-list', value: spots }],
  expected: { shape: 'linked-list', value: reversed },
});

const longHunt = Array.from({ length: 60 }, (_, index) => `Stop ${String(index + 1)}`);

export const reverseListExercise: Exercise = {
  functionName: 'reverseList',
  starterCode:
    'function reverseList(head: ListNode | null): ListNode | null {\n  return head;\n}\n',
  referenceSolution: `function reverseList(head: ListNode | null): ListNode | null {
  let previous: ListNode | null = null;
  let current = head;
  while (current !== null) {
    const next = current.next;
    current.next = previous;
    previous = current;
    current = next;
  }
  return previous;
}
`,
  visibleTests: [
    reverseOf('three-spots', ['Mat', 'Mail', 'Clock'], ['Clock', 'Mail', 'Mat']),
    reverseOf('four-spots', ['Mat', 'Mail', 'Clock', 'Oven'], ['Oven', 'Clock', 'Mail', 'Mat']),
    reverseOf('single-spot', ['Mat'], ['Mat']),
    reverseOf('empty-hunt', null, null),
    reverseOf('same-both-ways', ['Mat', 'Mail', 'Mat'], ['Mat', 'Mail', 'Mat']),
  ],
  hiddenTests: [
    reverseOf('two-spots', ['Mat', 'Mail'], ['Mail', 'Mat']),
    reverseOf(
      'five-spots',
      ['Mat', 'Mail', 'Clock', 'Oven', 'Shed'],
      ['Shed', 'Oven', 'Clock', 'Mail', 'Mat'],
    ),
    reverseOf('repeated-spots', ['Oven', 'Oven', 'Shed', 'Oven'], ['Oven', 'Shed', 'Oven', 'Oven']),
    reverseOf('long-hunt', longHunt, [...longHunt].reverse()),
    reverseOf(
      'last-spot-named-like-first',
      ['Mat', 'Mail', 'Clock', 'Mat'],
      ['Mat', 'Clock', 'Mail', 'Mat'],
    ),
    reverseOf('spaces-and-accents', ['Café', 'Old oak', 'Shed'], ['Shed', 'Old oak', 'Café']),
  ],
  complexityTest: {
    id: 'long-hunt-complexity',
    generator: { kind: 'linked-list-range', size: 100000 },
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(n)',
  },
  hintCount: 3,
};
