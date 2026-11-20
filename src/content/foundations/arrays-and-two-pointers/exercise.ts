import type { Exercise, TestCase } from '@/domain';

const pairIn = (
  id: string,
  prices: readonly number[],
  balance: number,
  expected: readonly [number, number] | null,
): TestCase => ({
  id,
  args: [
    { shape: 'value', value: prices },
    { shape: 'value', value: balance },
  ],
  expected: { shape: 'value', value: expected },
});

const evenPrices = Array.from({ length: 2000 }, (_, index) => index * 2);

export const twoSumSortedExercise: Exercise = {
  functionName: 'twoSumSorted',
  starterCode:
    'function twoSumSorted(prices: number[], balance: number): [number, number] | null {\n  return null;\n}\n',
  referenceSolution: `function twoSumSorted(prices: number[], balance: number): [number, number] | null {
  let left = 0;
  let right = prices.length - 1;
  while (left < right) {
    const sum = (prices[left] ?? 0) + (prices[right] ?? 0);
    if (sum === balance) return [left, right];
    if (sum < balance) left += 1;
    else right -= 1;
  }
  return null;
}
`,
  visibleTests: [
    pairIn('gift-card', [4, 7, 12, 19, 25, 30], 31, [2, 3]),
    pairIn('spend-it-all', [3, 8, 15, 21], 29, [1, 3]),
    pairIn('no-pair', [4, 7, 12], 5, null),
    pairIn('balance-too-high', [4, 7, 12, 19], 100, null),
    pairIn('same-price-twice', [6, 6, 9, 14], 12, [0, 1]),
  ],
  hiddenTests: [
    pairIn('empty-list', [], 10, null),
    pairIn('single-price', [10], 10, null),
    pairIn('cheapest-and-dearest', [1, 5, 8, 20, 40], 41, [0, 4]),
    pairIn('price-not-reused', [5, 9, 13], 10, null),
    pairIn('zero-balance', [0, 0, 3], 0, [0, 1]),
    pairIn('long-list-pair-at-the-end', evenPrices, 7994, [1998, 1999]),
    pairIn('long-list-no-pair', evenPrices, 7, null),
  ],
  complexityTest: {
    id: 'long-list-complexity',
    generator: { kind: 'range', size: 30000 },
    extraArgs: [{ shape: 'value', value: 59997 }],
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(n)',
  },
  hintCount: 3,
};
