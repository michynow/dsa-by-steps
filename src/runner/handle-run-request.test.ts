import type { ComplexityTest, TestCase } from '@/domain';
import { handleRunRequest } from './handle-run-request';
import type { RunResponse } from './protocol';

const anyNumber = expect.any(Number) as number;
const tagged = { version: 1, nonce: 'nonce-1' };

const sum = (id: string, xs: readonly number[], total: number): TestCase => ({
  id,
  args: [{ shape: 'value', value: xs }],
  expected: { shape: 'value', value: total },
});

const correct = 'function sum(xs) { return xs.reduce((a, b) => a + b, 0); }';

const complexityTest: ComplexityTest = {
  id: 'big',
  generator: { kind: 'range', size: 10 },
  expected: 'reference',
  budgetMultiple: 5,
  complexity: 'O(n)',
};

function collect(request: unknown) {
  const posted: RunResponse[] = [];
  const result = handleRunRequest(request, (response) => posted.push(response));
  return { result, posted };
}

describe('handleRunRequest', () => {
  it('streams test-started and outcome per test, then done, all tagged with the nonce', () => {
    const { result, posted } = collect({
      ...tagged,
      type: 'run-tests',
      functionName: 'sum',
      code: correct,
      tests: [sum('one', [1, 2], 3), sum('two', [1, 2], 4)],
    });
    expect({ result, posted }).toEqual({
      result: { ok: true, value: undefined },
      posted: [
        { ...tagged, type: 'test-started', testId: 'one' },
        {
          ...tagged,
          type: 'outcome',
          outcome: { kind: 'passed', testId: 'one', durationMs: anyNumber },
        },
        { ...tagged, type: 'test-started', testId: 'two' },
        {
          ...tagged,
          type: 'outcome',
          outcome: {
            kind: 'failed',
            testId: 'two',
            args: [{ shape: 'value', value: [1, 2] }],
            expected: { shape: 'value', value: 4 },
            actual: { shape: 'value', value: 3 },
          },
        },
        { ...tagged, type: 'done' },
      ],
    });
  });

  it('posts reference-timed before the complexity outcome, then done', () => {
    const { posted } = collect({
      ...tagged,
      type: 'run-complexity',
      functionName: 'sum',
      learnerCode: correct,
      referenceCode: correct,
      test: complexityTest,
    });
    expect(posted).toEqual([
      { ...tagged, type: 'reference-timed', ms: anyNumber, budgetMs: 50 },
      {
        ...tagged,
        type: 'outcome',
        outcome: { kind: 'passed', testId: 'big', durationMs: anyNumber },
      },
      { ...tagged, type: 'done' },
    ]);
  });

  it('posts internal-error when the Reference throws', () => {
    const { posted } = collect({
      ...tagged,
      type: 'run-complexity',
      functionName: 'sum',
      learnerCode: correct,
      referenceCode: 'function sum() { throw new Error("broken"); }',
      test: complexityTest,
    });
    expect(posted).toEqual([{ ...tagged, type: 'internal-error', message: 'Reference: broken' }]);
  });

  it('rejects a malformed request without posting', () => {
    expect(collect({ version: 2 })).toEqual({
      result: {
        ok: false,
        error: "type: Invalid discriminator value. Expected 'run-tests' | 'run-complexity'",
      },
      posted: [],
    });
  });
});
