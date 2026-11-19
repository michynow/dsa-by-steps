import type { TestOutcome } from '@/domain';
import { parseRunRequest, parseRunResponse } from './protocol';

const tagged = { version: 1, nonce: 'n1' };

const testRequest = {
  ...tagged,
  type: 'run-tests',
  functionName: 'f',
  code: 'function f() {}',
  tests: [
    {
      id: 'a',
      args: [{ shape: 'value', value: 1 }],
      expected: { shape: 'linked-list', value: [1] },
    },
  ],
};

const complexityRequest = {
  ...tagged,
  type: 'run-complexity',
  functionName: 'f',
  learnerCode: 'function f() {}',
  referenceCode: 'function f() {}',
  test: {
    id: 'c',
    generator: { kind: 'range', size: 3 },
    expected: 'reference',
    budgetMultiple: 5,
    complexity: 'O(n)',
  },
};

const outcomes: readonly TestOutcome[] = [
  { kind: 'passed', testId: 'a', durationMs: 1 },
  { kind: 'errored', testId: 'b', message: 'm' },
  { kind: 'errored', testId: 'b', message: 'm', reason: 'stack-overflow' },
  { kind: 'skipped', testId: 'b' },
  { kind: 'timed-out', testId: 'c', limitMs: 5 },
  { kind: 'too-slow', testId: 'd', durationMs: 9, budgetMs: 5, complexity: 'O(n)' },
  {
    kind: 'failed',
    testId: 'e',
    args: [{ shape: 'value', value: [1] }],
    expected: { shape: 'value', value: 1 },
    actual: { shape: 'linked-list', value: null },
  },
];

describe('parseRunRequest', () => {
  it.each([
    ['run-tests', testRequest],
    ['run-complexity', complexityRequest],
  ])('accepts a well-formed %s request', (_name, request) => {
    expect(parseRunRequest(request)).toEqual({ ok: true, value: request });
  });

  it.each([
    ['not an object', 'nope', ': Invalid input: expected object, received string'],
    ['null', null, ': Invalid input: expected object, received null'],
    [
      'unknown type',
      { ...testRequest, type: 'stop' },
      "type: Invalid discriminator value. Expected 'run-tests' | 'run-complexity'",
    ],
    ['version mismatch', { ...testRequest, version: 2 }, 'version: Invalid input: expected 1'],
    [
      'missing nonce',
      { ...testRequest, nonce: undefined },
      'nonce: Invalid input: expected string, received undefined',
    ],
    [
      'code not a string',
      { ...testRequest, code: 5 },
      'code: Invalid input: expected string, received number',
    ],
    [
      'bad shaped value',
      {
        ...testRequest,
        tests: [
          {
            id: 'a',
            args: [{ shape: 'linked-list', value: 5 }],
            expected: { shape: 'value', value: 1 },
          },
        ],
      },
      'tests.0.args.0: Invalid input',
    ],
    [
      'complexity test with unknown generator',
      {
        ...complexityRequest,
        test: { ...complexityRequest.test, generator: { kind: 'spiral', size: 3 } },
      },
      'test.generator.kind: Invalid option: expected one of "range"|"linked-list-range"',
    ],
  ])('rejects %s', (_name, data, message) => {
    expect(parseRunRequest(data)).toEqual({ ok: false, error: message });
  });
});

describe('parseRunResponse', () => {
  const accepted: readonly (readonly [string, unknown])[] = [
    ['test-started', { ...tagged, type: 'test-started', testId: 'a' }],
    ['reference-timed', { ...tagged, type: 'reference-timed', ms: 1.5, budgetMs: 50 }],
    ['internal-error', { ...tagged, type: 'internal-error', message: 'm' }],
    ['done', { ...tagged, type: 'done' }],
    ...outcomes.map((outcome): readonly [string, unknown] => [
      `outcome ${outcome.kind}`,
      { ...tagged, type: 'outcome', outcome },
    ]),
  ];

  it.each(accepted)('accepts %s', (_name, response) => {
    expect(parseRunResponse(response)).toEqual({ ok: true, value: response });
  });

  it.each([
    [
      'version mismatch',
      { version: 2, nonce: 'n1', type: 'done' },
      'version: Invalid input: expected 1',
    ],
    [
      'missing nonce',
      { version: 1, type: 'done' },
      'nonce: Invalid input: expected string, received undefined',
    ],
    [
      'unknown type',
      { ...tagged, type: 'report' },
      "type: Invalid discriminator value. Expected 'test-started' | 'outcome' | 'reference-timed' | 'internal-error' | 'done'",
    ],
    [
      'unknown outcome kind',
      { ...tagged, type: 'outcome', outcome: { kind: 'unknown', testId: 'x' } },
      "outcome.kind: Invalid discriminator value. Expected 'passed' | 'failed' | 'errored' | 'skipped' | 'timed-out' | 'too-slow'",
    ],
    [
      'outcome missing duration',
      { ...tagged, type: 'outcome', outcome: { kind: 'passed', testId: 'x' } },
      'outcome.durationMs: Invalid input: expected number, received undefined',
    ],
    [
      'unknown reason',
      {
        ...tagged,
        type: 'outcome',
        outcome: { kind: 'errored', testId: 'x', message: 'm', reason: 'oops' },
      },
      'outcome.reason: Invalid input: expected "stack-overflow"',
    ],
    ['extra field', { ...tagged, type: 'done', extra: 1 }, ': Unrecognized key: "extra"'],
    ['not an object', 7, ': Invalid input: expected object, received number'],
  ])('rejects %s', (_name, data, message) => {
    expect(parseRunResponse(data)).toEqual({ ok: false, error: message });
  });
});
