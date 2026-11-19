import type { RunReport } from '@/domain';
import { parseRunRequest, parseRunResponse } from './protocol';

const request = {
  version: 1,
  type: 'run',
  mode: 'run',
  exercise: {
    functionName: 'f',
    visibleTests: [
      {
        id: 'a',
        args: [{ shape: 'value', value: 1 }],
        expected: { shape: 'linked-list', value: [1] },
      },
    ],
    hiddenTests: [],
    referenceSolution: 'function f() {}',
  },
  code: 'function f() {}',
};

const report: RunReport = {
  mode: 'run',
  passed: false,
  outcomes: [
    { kind: 'passed', testId: 'a', durationMs: 1 },
    { kind: 'errored', testId: 'b', message: 'm' },
    { kind: 'timed-out', testId: 'c', limitMs: 5 },
    { kind: 'too-slow', testId: 'd', durationMs: 9, budgetMs: 5, complexity: 'O(n)' },
    {
      kind: 'failed',
      testId: 'e',
      args: [{ shape: 'value', value: [1] }],
      expected: { shape: 'value', value: 1 },
      actual: { shape: 'linked-list', value: null },
    },
  ],
};

describe('parseRunRequest', () => {
  it('accepts a well-formed request', () => {
    expect(parseRunRequest(request)).toEqual({ ok: true, value: request });
  });

  it('accepts an optional complexity test', () => {
    const complexityTest = {
      id: 'c',
      generator: { kind: 'range', size: 3 },
      expected: 'reference',
      budgetMultiple: 5,
      complexity: 'O(n)',
    };
    const withComplexity = { ...request, exercise: { ...request.exercise, complexityTest } };
    expect(parseRunRequest(withComplexity)).toEqual({ ok: true, value: withComplexity });
  });

  it.each([
    ['not an object', 'nope', ': Invalid input: expected object, received string'],
    ['null', null, ': Invalid input: expected object, received null'],
    ['version mismatch', { ...request, version: 2 }, 'version: Invalid input: expected 1'],
    ['missing version', { ...request, version: undefined }, 'version: Invalid input: expected 1'],
    ['unknown type', { ...request, type: 'stop' }, 'type: Invalid input: expected "run"'],
    [
      'unknown mode',
      { ...request, mode: 'peek' },
      'mode: Invalid option: expected one of "run"|"submit"',
    ],
    [
      'code not a string',
      { ...request, code: 5 },
      'code: Invalid input: expected string, received number',
    ],
    [
      'bad shaped value',
      {
        ...request,
        exercise: {
          ...request.exercise,
          visibleTests: [
            {
              id: 'a',
              args: [{ shape: 'linked-list', value: 5 }],
              expected: { shape: 'value', value: 1 },
            },
          ],
        },
      },
      'exercise.visibleTests.0.args.0: Invalid input',
    ],
    [
      'missing function name',
      { ...request, exercise: { ...request.exercise, functionName: undefined } },
      'exercise.functionName: Invalid input: expected string, received undefined',
    ],
  ])('rejects %s', (_name, data, message) => {
    expect(parseRunRequest(data)).toEqual({ ok: false, error: message });
  });
});

describe('parseRunResponse', () => {
  it('accepts a report with every outcome kind', () => {
    const response = { version: 1, type: 'report', report };
    expect(parseRunResponse(response)).toEqual({ ok: true, value: response });
  });

  it('accepts a compile error', () => {
    const response = {
      version: 1,
      type: 'compile-error',
      error: { message: 'm', line: 1, column: 2 },
    };
    expect(parseRunResponse(response)).toEqual({ ok: true, value: response });
  });

  it.each([
    [
      'version mismatch',
      { version: 2, type: 'report', report },
      'version: Invalid input: expected 1',
    ],
    [
      'unknown type',
      { version: 1, type: 'log' },
      "type: Invalid discriminator value. Expected 'report' | 'compile-error'",
    ],
    [
      'unknown outcome kind',
      {
        version: 1,
        type: 'report',
        report: { ...report, outcomes: [{ kind: 'skipped', testId: 'x' }] },
      },
      "report.outcomes.0.kind: Invalid discriminator value. Expected 'passed' | 'failed' | 'errored' | 'timed-out' | 'too-slow'",
    ],
    [
      'outcome missing duration',
      {
        version: 1,
        type: 'report',
        report: { ...report, outcomes: [{ kind: 'passed', testId: 'x' }] },
      },
      'report.outcomes.0.durationMs: Invalid input: expected number, received undefined',
    ],
    [
      'compile error without line',
      { version: 1, type: 'compile-error', error: { message: 'm', column: 2 } },
      'error.line: Invalid input: expected number, received undefined',
    ],
    ['not an object', 7, ': Invalid input: expected object, received number'],
  ])('rejects %s', (_name, data, message) => {
    expect(parseRunResponse(data)).toEqual({ ok: false, error: message });
  });
});
