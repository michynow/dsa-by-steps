import type { ComplexityTest, InputGenerator, ShapedValue, TestOutcome } from '@/domain';
import { timeBudget } from '@/domain';
import type { Callable } from './execute';
import { callTimed, loadFunction } from './execute';
import { ListNode, shapedEqual, toArgument, toShaped } from './values';

export interface ComplexityInput {
  readonly learnerCode: string;
  readonly referenceCode: string;
  readonly functionName: string;
  readonly test: ComplexityTest;
}

function generateInput(generator: InputGenerator): ShapedValue {
  const value = Array.from({ length: generator.size }, (_, index) => index);
  return { shape: generator.kind === 'range' ? 'value' : 'linked-list', value };
}

function errored(test: ComplexityTest, message: string): TestOutcome {
  return { kind: 'errored', testId: test.id, message };
}

function shapeOfResult(result: unknown): ShapedValue['shape'] {
  return result instanceof ListNode ? 'linked-list' : 'value';
}

function load(code: string, input: ComplexityInput): Callable | string {
  const loaded = loadFunction(code, input.functionName);
  return loaded.ok ? loaded.value : loaded.error;
}

export function measureComplexity(input: ComplexityInput): TestOutcome {
  const { test } = input;
  const reference = load(input.referenceCode, input);
  const learner = load(input.learnerCode, input);
  if (typeof reference === 'string') return errored(test, `Reference: ${reference}`);
  if (typeof learner === 'string') return errored(test, learner);
  const shaped = generateInput(test.generator);
  const expectedCall = callTimed(reference, [toArgument(shaped)]);
  if (!expectedCall.ok) return errored(test, `Reference: ${expectedCall.error}`);
  const budgetMs = timeBudget(expectedCall.value.durationMs, test.budgetMultiple);
  const actualCall = callTimed(learner, [toArgument(shaped)]);
  if (!actualCall.ok) return errored(test, actualCall.error);
  const resultShape = shapeOfResult(expectedCall.value.result);
  const expected = toShaped(expectedCall.value.result, resultShape);
  const actual = toShaped(actualCall.value.result, resultShape);
  if (!expected.ok) return errored(test, `Reference: ${expected.error}`);
  if (!actual.ok) return errored(test, actual.error);
  if (!shapedEqual(expected.value, actual.value)) {
    return {
      kind: 'failed',
      testId: test.id,
      args: [shaped],
      expected: expected.value,
      actual: actual.value,
    };
  }
  const { durationMs } = actualCall.value;
  return durationMs > budgetMs
    ? { kind: 'too-slow', testId: test.id, durationMs, budgetMs, complexity: test.complexity }
    : { kind: 'passed', testId: test.id, durationMs };
}
