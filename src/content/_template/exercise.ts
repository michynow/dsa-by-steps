import type { Exercise, TestCase } from '@/domain';

const secondOf = (id: string, numbers: readonly number[], expected: number): TestCase => ({
  id,
  args: [{ shape: 'value', value: numbers }],
  expected: { shape: 'value', value: expected },
});

export const templateExercise: Exercise = {
  functionName: 'secondNumber',
  starterCode: 'function secondNumber(numbers: number[]): number {\n  return 0;\n}\n',
  referenceSolution:
    'function secondNumber(numbers: number[]): number {\n  return numbers[1];\n}\n',
  visibleTests: [
    secondOf('two-numbers', [4, 7], 7),
    secondOf('three-numbers', [4, 7, 9], 7),
    secondOf('repeated-numbers', [5, 5, 5], 5),
    secondOf('four-numbers', [4, 7, 9, 1], 7),
    secondOf('long-numbers', [2, 6, 1, 8, 3], 6),
  ],
  hiddenTests: [secondOf('negative-numbers', [-3, -8, -1], -8)],
  hintCount: 2,
};
