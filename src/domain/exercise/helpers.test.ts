import { describe, expect, it } from 'vitest';
import {
  complexityFor,
  isJsonValue,
  isShapedValue,
  reportPassed,
  testsFor,
  timeBudget,
  timeBudgetFloorMs,
} from './helpers';
import type { ComplexityTest, Exercise, TestCase, TestOutcome } from './types';

const testCase = (id: string): TestCase => ({
  id,
  args: [{ shape: 'value', value: [1] }],
  expected: { shape: 'value', value: 1 },
});

const exercise: Exercise = {
  functionName: 'first',
  starterCode: 'function first(xs) {}',
  referenceSolution: 'function first(xs) { return xs[0]; }',
  visibleTests: [testCase('v1'), testCase('v2')],
  hiddenTests: [testCase('h1')],
  hintCount: 2,
};

const passed: TestOutcome = { kind: 'passed', testId: 'v1', durationMs: 1 };

const nonPassing: readonly TestOutcome[] = [
  {
    kind: 'failed',
    testId: 'x',
    args: [],
    expected: { shape: 'value', value: 1 },
    actual: { shape: 'value', value: 2 },
  },
  { kind: 'errored', testId: 'x', message: 'boom' },
  { kind: 'timed-out', testId: 'x', limitMs: 1000 },
  { kind: 'too-slow', testId: 'x', durationMs: 90, budgetMs: 50, complexity: 'O(n)' },
];

describe('testsFor', () => {
  it('returns only the visible tests for a run', () => {
    expect(testsFor(exercise, 'run')).toEqual([testCase('v1'), testCase('v2')]);
  });

  it('returns visible tests then hidden tests for a submit', () => {
    expect(testsFor(exercise, 'submit')).toEqual([testCase('v1'), testCase('v2'), testCase('h1')]);
  });
});

const complexityTest: ComplexityTest = {
  id: 'big',
  generator: { kind: 'range', size: 1000 },
  expected: 'reference',
  budgetMultiple: 5,
  complexity: 'O(n)',
};

describe('complexityFor', () => {
  it('returns the Complexity Test for a submit', () => {
    expect(complexityFor({ ...exercise, complexityTest }, 'submit')).toEqual(complexityTest);
  });

  it('returns nothing for a run', () => {
    expect(complexityFor({ ...exercise, complexityTest }, 'run')).toBeUndefined();
  });

  it('returns nothing when the exercise has none', () => {
    expect(complexityFor(exercise, 'submit')).toBeUndefined();
  });
});

describe('isJsonValue', () => {
  class Point {
    x = 1;
  }
  const sparse: unknown[] = [];
  sparse[2] = 1;

  it.each([null, true, 'x', 0, -1.5, [], [1, [2]], { a: { b: [null] } }, Object.create(null)])(
    'accepts %j',
    (value) => {
      expect(isJsonValue(value)).toBe(true);
    },
  );

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    undefined,
    new Point(),
    new Date(0),
    sparse,
    [Number.NaN],
    { a: Number.NEGATIVE_INFINITY },
    () => 1,
  ])('rejects %s', (value) => {
    expect(isJsonValue(value)).toBe(false);
  });
});

describe('reportPassed', () => {
  it('is false for no outcomes', () => {
    expect(reportPassed([])).toBe(false);
  });

  it('is true when every outcome passed', () => {
    expect(reportPassed([passed, { ...passed, testId: 'v2' }])).toBe(true);
  });

  it.each(nonPassing)('is false when one outcome is $kind', (bad) => {
    expect(reportPassed([passed, bad])).toBe(false);
  });
});

describe('timeBudget', () => {
  it('multiplies the reference time above the floor', () => {
    expect(timeBudget(100, 4)).toBe(400);
  });

  it('never falls below the floor', () => {
    expect(timeBudgetFloorMs).toBe(50);
    expect(timeBudget(1, 4)).toBe(50);
  });

  it('equals the floor when the product equals it', () => {
    expect(timeBudget(12.5, 4)).toBe(50);
  });
});

describe('isShapedValue', () => {
  it.each([
    { shape: 'value', value: null },
    { shape: 'value', value: { a: [1, 'x', true] } },
    { shape: 'linked-list', value: [1, 2] },
  ])('accepts %j', (value) => {
    expect(isShapedValue(value)).toBe(true);
  });

  it.each([
    null,
    'x',
    [],
    {},
    { shape: 'value' },
    { value: 1 },
    { shape: 'tree', value: 1 },
    { shape: 'value', value: undefined },
    { shape: 'value', value: () => 1 },
    { shape: 'value', value: [undefined] },
    { shape: 'value', value: 1, extra: 1 },
    { shape: 'linked-list', value: { a: 1 } },
    { shape: 'linked-list', value: 3 },
    { shape: 'linked-list', value: 'x' },
    { shape: 'value', value: Number.NaN },
  ])('rejects %j', (value) => {
    expect(isShapedValue(value)).toBe(false);
  });
});
