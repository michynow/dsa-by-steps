import type { Exercise, TestCase } from '@/domain';

type Range = readonly [number, number];

const totalsOn = (
  id: string,
  sales: readonly number[],
  ranges: readonly Range[],
  expected: readonly number[],
): TestCase => ({
  id,
  args: [
    { shape: 'value', value: sales },
    { shape: 'value', value: ranges },
  ],
  expected: { shape: 'value', value: expected },
});

const weekOfSales = [4, 2, 5, 3, 6, 1, 4];

const longRunOfSales = Array.from({ length: 3000 }, (_, index) => index % 7);

const manyLongRanges: readonly Range[] = Array.from({ length: 3000 }, (_, index) => [
  (index * 37) % 1000,
  199999 - ((index * 53) % 1000),
]);

export const rangeTotalsExercise: Exercise = {
  functionName: 'rangeTotals',
  starterCode:
    'function rangeTotals(sales: number[], ranges: [number, number][]): number[] {\n  return [];\n}\n',
  referenceSolution: `function rangeTotals(sales: number[], ranges: [number, number][]): number[] {
  const totals: number[] = [0];
  for (const sale of sales) {
    totals.push((totals[totals.length - 1] ?? 0) + sale);
  }
  return ranges.map(([first, last]) => (totals[last + 1] ?? 0) - (totals[first] ?? 0));
}
`,
  visibleTests: [
    totalsOn('one-range', weekOfSales, [[2, 5]], [15]),
    totalsOn(
      'first-and-last-days',
      weekOfSales,
      [
        [0, 0],
        [6, 6],
      ],
      [4, 4],
    ),
    totalsOn(
      'several-ranges',
      weekOfSales,
      [
        [0, 3],
        [1, 1],
        [3, 6],
      ],
      [14, 2, 14],
    ),
    totalsOn(
      'back-to-back-ranges',
      weekOfSales,
      [
        [0, 2],
        [3, 6],
      ],
      [11, 14],
    ),
    totalsOn(
      'overlapping-and-repeated-ranges',
      weekOfSales,
      [
        [0, 6],
        [2, 4],
        [2, 4],
        [5, 6],
      ],
      [25, 14, 14, 5],
    ),
  ],
  hiddenTests: [
    totalsOn('no-ranges', weekOfSales, [], []),
    totalsOn('no-sales-and-no-ranges', [], [], []),
    totalsOn('single-day', [7], [[0, 0]], [7]),
    totalsOn('whole-range', [3, 1, 4, 1, 5], [[0, 4]], [14]),
    totalsOn(
      'first-and-last-day',
      [3, 1, 4, 1, 5],
      [
        [0, 0],
        [4, 4],
      ],
      [3, 5],
    ),
    totalsOn(
      'refunds-and-zero-days',
      [5, -2, 0, 3],
      [
        [0, 3],
        [1, 2],
        [1, 1],
      ],
      [6, -2, -2],
    ),
    totalsOn(
      'long-run-of-days',
      longRunOfSales,
      [
        [0, 2999],
        [1000, 1999],
        [2999, 2999],
      ],
      [8994, 2998, 3],
    ),
  ],
  complexityTest: {
    id: 'many-ranges-complexity',
    generator: { kind: 'range', size: 200000 },
    extraArgs: [{ shape: 'value', value: manyLongRanges }],
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(n + q)',
  },
  hintCount: 3,
};
