import type { Exercise, TestCase } from '@/domain';

const countPairsOf = (
  id: string,
  prices: readonly number[],
  target: number,
  pairs: number,
): TestCase => ({
  id,
  args: [
    { shape: 'value', value: prices },
    { shape: 'value', value: target },
  ],
  expected: { shape: 'value', value: pairs },
});

const busyDay = Array.from({ length: 2000 }, (_, index) => index % 100);

export const countPairsWithSumExercise: Exercise = {
  functionName: 'countPairsWithSum',
  starterCode:
    'function countPairsWithSum(prices: number[], target: number): number {\n  return 0;\n}\n',
  referenceSolution: `function countPairsWithSum(prices: number[], target: number): number {
  const seen = new Map<number, number>();
  let pairs = 0;
  for (const price of prices) {
    pairs += seen.get(target - price) ?? 0;
    seen.set(price, (seen.get(price) ?? 0) + 1);
  }
  return pairs;
}
`,
  visibleTests: [
    countPairsOf('one-pair', [4, 6, 1, 2], 10, 1),
    countPairsOf('nothing-adds-up', [2, 3, 9], 20, 0),
    countPairsOf('several-pairs', [1, 5, 3, 3, 7, 2], 8, 3),
    countPairsOf('two-and-two', [4, 4, 6, 6], 10, 4),
    countPairsOf('same-price-three-times', [5, 5, 5], 10, 3),
  ],
  hiddenTests: [
    countPairsOf('empty-list', [], 10, 0),
    countPairsOf('single-price', [5], 10, 0),
    countPairsOf('no-pair-adds-up', [1, 2, 3], 100, 0),
    countPairsOf('free-items', [0, 0, 0, 0], 0, 6),
    countPairsOf('negative-prices', [-2, 2, 5, -5, 0], 0, 2),
    countPairsOf('first-and-last', [3, 1, 1, 7], 10, 1),
    countPairsOf('busy-day', busyDay, 99, 20000),
  ],
  complexityTest: {
    id: 'many-prices-complexity',
    generator: { kind: 'range', size: 30000 },
    extraArgs: [{ shape: 'value', value: 29999 }],
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(n)',
  },
  hintCount: 3,
};
