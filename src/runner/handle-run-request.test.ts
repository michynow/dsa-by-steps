import type { ComplexityTest, Exercise, TestCase } from '@/domain';
import { handleRunRequest } from './handle-run-request';

const sum = (id: string, xs: readonly number[], total: number): TestCase => ({
  id,
  args: [{ shape: 'value', value: xs }],
  expected: { shape: 'value', value: total },
});

const complexityTest: ComplexityTest = {
  id: 'big',
  generator: { kind: 'range', size: 10 },
  expected: 'reference',
  budgetMultiple: 5,
  complexity: 'O(n)',
};

const exercise: Exercise = {
  functionName: 'sum',
  starterCode: '',
  referenceSolution: 'function sum(xs: number[]): number { return xs.reduce((a, b) => a + b, 0); }',
  visibleTests: [sum('visible', [1, 2], 3)],
  hiddenTests: [sum('hidden', [4, 5], 9)],
  complexityTest,
  hintCount: 0,
};

const message = (mode: 'run' | 'submit', code: string) => ({
  version: 1,
  type: 'run',
  mode,
  exercise: {
    functionName: exercise.functionName,
    visibleTests: exercise.visibleTests,
    hiddenTests: exercise.hiddenTests,
    complexityTest,
    referenceSolution: exercise.referenceSolution,
  },
  code,
});

const correct = 'function sum(xs: number[]): number { return xs.reduce((a, b) => a + b, 0); }';

const anyNumber = expect.any(Number) as number;

describe('handleRunRequest', () => {
  it('run mode executes only visible tests', () => {
    const result = handleRunRequest(message('run', correct));
    expect(result.ok && result.value.type === 'report' && result.value.report).toEqual({
      mode: 'run',
      passed: true,
      outcomes: [{ kind: 'passed', testId: 'visible', durationMs: anyNumber }],
    });
  });

  it('submit mode executes visible, hidden and the complexity test', () => {
    const result = handleRunRequest(message('submit', correct));
    const ids =
      result.ok &&
      result.value.type === 'report' &&
      result.value.report.outcomes.map((o) => o.testId);
    expect(ids).toEqual(['visible', 'hidden', 'big']);
  });

  it('reports a compile error without running tests', () => {
    expect(handleRunRequest(message('run', 'const = 1;'))).toEqual({
      ok: true,
      value: {
        version: 1,
        type: 'compile-error',
        error: { message: 'Variable declaration expected.', line: 1, column: 7 },
      },
    });
  });

  it('rejects a malformed message', () => {
    expect(handleRunRequest({ version: 2 })).toEqual({
      ok: false,
      error:
        'version: Invalid input: expected 1; type: Invalid input: expected "run"; mode: Invalid option: expected one of "run"|"submit"; exercise: Invalid input: expected object, received undefined; code: Invalid input: expected string, received undefined',
    });
  });
});
