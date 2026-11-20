import type { Exercise, TestCase } from '@/domain';

const firstDuplicateOf = (
  id: string,
  usernames: readonly string[],
  duplicate: string | null,
): TestCase => ({
  id,
  args: [{ shape: 'value', value: usernames }],
  expected: { shape: 'value', value: duplicate },
});

const busyDay = [...Array.from({ length: 5000 }, (_, index) => `user${String(index)}`), 'user42'];

export const firstDuplicateExercise: Exercise = {
  functionName: 'firstDuplicate',
  starterCode:
    'function firstDuplicate(usernames: (string | number)[]): string | number | null {\n  return null;\n}\n',
  referenceSolution: `function firstDuplicate(usernames: (string | number)[]): string | number | null {
  const seen = new Set<string | number>();
  for (const username of usernames) {
    if (seen.has(username)) return username;
    seen.add(username);
  }
  return null;
}
`,
  visibleTests: [
    firstDuplicateOf('one-repeat', ['ada', 'linus', 'ada'], 'ada'),
    firstDuplicateOf('back-to-back', ['ada', 'ada'], 'ada'),
    firstDuplicateOf('all-different', ['ada', 'linus', 'grace'], null),
    firstDuplicateOf('repeat-far-apart', ['ada', 'linus', 'grace', 'turing', 'ada'], 'ada'),
    firstDuplicateOf('second-registration-decides', ['ada', 'linus', 'linus', 'ada'], 'linus'),
  ],
  hiddenTests: [
    firstDuplicateOf('empty-list', [], null),
    firstDuplicateOf('single-sign-up', ['ada'], null),
    firstDuplicateOf('registered-three-times', ['ada', 'ada', 'ada'], 'ada'),
    firstDuplicateOf('repeat-at-the-end', ['ada', 'linus', 'grace', 'grace'], 'grace'),
    firstDuplicateOf('letter-case-differs', ['Ada', 'ada'], null),
    firstDuplicateOf('busy-day', busyDay, 'user42'),
  ],
  complexityTest: {
    id: 'many-sign-ups-complexity',
    generator: { kind: 'range', size: 100000 },
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(n)',
  },
  hintCount: 3,
};
