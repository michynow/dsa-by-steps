import type { Exercise, TestCase } from '@/domain';

const reportsOn = (
  id: string,
  builds: readonly number[],
  reports: readonly number[],
  expected: readonly number[],
): TestCase => ({
  id,
  args: [
    { shape: 'value', value: builds },
    { shape: 'value', value: reports },
  ],
  expected: { shape: 'value', value: expected },
});

const evenBuilds = Array.from({ length: 5000 }, (_, index) => index * 2);

const lateReports = Array.from(
  { length: 4000 },
  (_, index) => 199999 - ((index * 7) % 50) + (index % 2),
);

export const firstCommitAtOrAfterExercise: Exercise = {
  functionName: 'firstCommitAtOrAfter',
  starterCode:
    'function firstCommitAtOrAfter(builds: number[], reports: number[]): number[] {\n  return [];\n}\n',
  referenceSolution: `function firstCommitAtOrAfter(builds: number[], reports: number[]): number[] {
  return reports.map((report) => {
    let lo = 0;
    let hi = builds.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if ((builds[mid] ?? 0) >= report) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  });
}
`,
  visibleTests: [
    reportsOn('one-report', [100, 101, 105, 110, 120], [105], [2]),
    reportsOn('several-reports', [100, 101, 105, 110, 120], [100, 110, 120], [0, 3, 4]),
    reportsOn('before-the-first-build', [100, 101, 105, 110, 120], [50, 100], [0, 0]),
    reportsOn(
      'between-builds-and-past-the-end',
      [100, 101, 105, 110, 120],
      [102, 111, 121],
      [2, 4, 5],
    ),
    reportsOn('first-of-repeated-builds', [100, 105, 105, 105, 120], [105, 106], [1, 4]),
  ],
  hiddenTests: [
    reportsOn('empty-history', [], [5, 9], [0, 0]),
    reportsOn('no-reports', [1, 2, 3], [], []),
    reportsOn('single-commit', [7], [3, 7, 8], [0, 0, 1]),
    reportsOn('first-and-last', [10, 20, 30, 40], [10, 40], [0, 3]),
    reportsOn('before-everything-and-after-everything', [10, 20, 30], [1, 31], [0, 3]),
    reportsOn('repeated-build-numbers', [5, 5, 5, 8, 8], [5, 6, 8], [0, 3, 3]),
    reportsOn('long-history', evenBuilds, [0, 1, 9999, 9998, 10000], [0, 1, 5000, 4999, 5000]),
  ],
  complexityTest: {
    id: 'long-history-complexity',
    generator: { kind: 'range', size: 200000 },
    extraArgs: [{ shape: 'value', value: lateReports }],
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(q log n)',
  },
  hintCount: 3,
};
