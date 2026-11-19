import type { Exercise, TestCase } from '@/domain';

const reverseOf = (
  id: string,
  songs: readonly string[] | null,
  reversed: readonly string[] | null,
): TestCase => ({
  id,
  args: [{ shape: 'linked-list', value: songs }],
  expected: { shape: 'linked-list', value: reversed },
});

const longQueue = Array.from({ length: 60 }, (_, index) => `Song ${String(index + 1)}`);

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
    reverseOf('three-songs', ['Intro', 'Echo', 'Drift'], ['Drift', 'Echo', 'Intro']),
    reverseOf('single-song', ['Intro'], ['Intro']),
    reverseOf('empty-queue', null, null),
  ],
  hiddenTests: [
    reverseOf('two-songs', ['Intro', 'Echo'], ['Echo', 'Intro']),
    reverseOf(
      'five-songs',
      ['Intro', 'Echo', 'Drift', 'Pulse', 'Glow'],
      ['Glow', 'Pulse', 'Drift', 'Echo', 'Intro'],
    ),
    reverseOf(
      'repeated-songs',
      ['Echo', 'Echo', 'Drift', 'Echo'],
      ['Echo', 'Drift', 'Echo', 'Echo'],
    ),
    reverseOf('long-queue', longQueue, [...longQueue].reverse()),
    reverseOf(
      'last-song-named-like-first',
      ['Intro', 'Echo', 'Drift', 'Intro'],
      ['Intro', 'Drift', 'Echo', 'Intro'],
    ),
    reverseOf(
      'spaces-and-accents',
      ['Café del Mar', 'Zażółć gęślą', 'Echo'],
      ['Echo', 'Zażółć gęślą', 'Café del Mar'],
    ),
  ],
  complexityTest: {
    id: 'long-queue-complexity',
    generator: { kind: 'linked-list-range', size: 100000 },
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(n)',
  },
  hintCount: 3,
};
