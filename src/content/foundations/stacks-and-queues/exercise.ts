import type { Exercise, TestCase } from '@/domain';

const lineOf = (id: string, code: string, balanced: boolean): TestCase => ({
  id,
  args: [{ shape: 'value', value: code }],
  expected: { shape: 'value', value: balanced },
});

const deepOpeners = '([{'.repeat(6000);
const deepClosers = '}])'.repeat(6000);

export const isBalancedExercise: Exercise = {
  functionName: 'isBalanced',
  starterCode: 'function isBalanced(code: string): boolean {\n  return false;\n}\n',
  referenceSolution: `function isBalanced(code: string): boolean {
  const closerFor: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const expectedClosers: string[] = [];
  for (const char of code) {
    const closer = closerFor[char];
    if (closer !== undefined) {
      expectedClosers.push(closer);
    } else if (char === ')' || char === ']' || char === '}') {
      if (expectedClosers.pop() !== char) return false;
    }
  }
  return expectedClosers.length === 0;
}
`,
  visibleTests: [
    lineOf('balanced-call', 'print(items[0])', true),
    lineOf('wrong-closer', 'total(a]', false),
    lineOf('crossed-pairs', 'if ([a) b]', false),
  ],
  hiddenTests: [
    lineOf('empty-line', '', true),
    lineOf('no-brackets', 'let total = 1 + 2;', true),
    lineOf('single-closer', ')', false),
    lineOf('closer-before-opener', ')(', false),
    lineOf('repeated-pairs', '(()())[][]{{}}', true),
    lineOf('unclosed-opener', 'run({ list: [1, 2] )', false),
    lineOf('deep-nesting', `${deepOpeners}${deepClosers}`, true),
  ],
  complexityTest: {
    id: 'long-line-complexity',
    generator: { kind: 'range', size: 100000 },
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(n)',
  },
  hintCount: 3,
};
