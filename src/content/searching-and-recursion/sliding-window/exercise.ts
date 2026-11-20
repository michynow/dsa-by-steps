import type { Exercise, TestCase } from '@/domain';

const busiestIn = (
  id: string,
  requests: readonly number[],
  size: number,
  expected: number,
): TestCase => ({
  id,
  args: [
    { shape: 'value', value: requests },
    { shape: 'value', value: size },
  ],
  expected: { shape: 'value', value: expected },
});

const steadyGrowth = Array.from({ length: 6000 }, (_, minute) => minute);

const quietLogWithRush = Array.from({ length: 8000 }, (_, minute) =>
  minute >= 4000 && minute < 4100 ? 5 : 1,
);

export const busiestWindowExercise: Exercise = {
  functionName: 'busiestWindow',
  starterCode:
    'function busiestWindow(requests: number[], size: number): number {\n  return -1;\n}\n',
  referenceSolution: `function busiestWindow(requests: number[], size: number): number {
  if (size < 1 || size > requests.length) return -1;
  let total = 0;
  for (let minute = 0; minute < size; minute++) total += requests[minute] ?? 0;
  let bestTotal = total;
  let bestStart = 0;
  for (let end = size; end < requests.length; end++) {
    total += (requests[end] ?? 0) - (requests[end - size] ?? 0);
    if (total > bestTotal) {
      bestTotal = total;
      bestStart = end - size + 1;
    }
  }
  return bestStart;
}
`,
  visibleTests: [
    busiestIn('rush-in-the-middle', [2, 5, 1, 4, 3, 6, 2, 1], 5, 1),
    busiestIn('window-at-the-start', [9, 4, 1, 2, 3], 2, 0),
    busiestIn('single-minute-window', [3, 8, 2, 8], 1, 1),
    busiestIn('rush-at-the-end', [1, 2, 1, 3, 8, 9], 2, 4),
    busiestIn('every-window-ties', [5, 1, 5, 1, 5, 1], 2, 0),
  ],
  hiddenTests: [
    busiestIn('empty-log', [], 3, -1),
    busiestIn('single-minute-log', [9], 1, 0),
    busiestIn('window-is-the-whole-log', [4, 1, 6], 3, 0),
    busiestIn('window-longer-than-the-log', [4, 1], 5, -1),
    busiestIn('earlier-window-wins-a-tie', [1, 5, 3, 3, 5, 1], 2, 1),
    busiestIn('rush-late-in-a-long-log', quietLogWithRush, 100, 4000),
    busiestIn('traffic-keeps-growing', steadyGrowth, 250, 5750),
  ],
  complexityTest: {
    id: 'long-log-complexity',
    generator: { kind: 'range', size: 200000 },
    extraArgs: [{ shape: 'value', value: 5000 }],
    expected: 'reference',
    budgetMultiple: 8,
    complexity: 'O(n)',
  },
  hintCount: 3,
};
