import type { ComplexityTest, InputGenerator, Result, ShapedValue, TestOutcome } from '@/domain';
import { assertNever, err, ok, timeBudgetFloorMs } from '@/domain';
import { callTimed, erroredOutcome, loadFunction } from './execute';
import { intrinsics } from './intrinsics';
import { ListNode, shapedEqual, toArgument } from './values';

export interface ReferenceTiming {
  readonly ms: number;
  readonly budgetMs: number;
}

export interface ComplexityInput {
  readonly learnerCode: string;
  readonly referenceCode: string;
  readonly functionName: string;
  readonly test: ComplexityTest;
  readonly onReferenceTimed?: (timing: ReferenceTiming) => void;
}

export function budgetOf(referenceMs: number, multiple: number): number {
  return intrinsics.max(referenceMs * multiple, timeBudgetFloorMs);
}

function generateInput(generator: InputGenerator): ShapedValue {
  switch (generator.kind) {
    case 'range':
      return { shape: 'value', value: Array.from({ length: generator.size }, (_, i) => i) };
    case 'linked-list-range':
      return { shape: 'linked-list', value: Array.from({ length: generator.size }, (_, i) => i) };
    case 'repeat-string':
      return { shape: 'value', value: generator.unit.repeat(generator.size) };
    case 'string-range':
      return {
        shape: 'value',
        value: Array.from({ length: generator.size }, (_, i) => generator.prefix + String(i)),
      };
    default:
      return assertNever(generator);
  }
}

function shapeOfResult(result: unknown): ShapedValue['shape'] {
  return result instanceof ListNode ? 'linked-list' : 'value';
}

export function measureComplexity(input: ComplexityInput): Result<TestOutcome, string> {
  const { test } = input;
  const reference = loadFunction(input.referenceCode, input.functionName);
  if (!reference.ok) return err(`Reference: ${reference.error.message}`);
  const shaped = generateInput(test.generator);
  const expected = callTimed(reference.value, [toArgument(shaped)], shapeOfResult);
  if (!expected.ok) return err(`Reference: ${expected.error.message}`);
  if (!expected.value.shaped.ok) return err(`Reference: ${expected.value.shaped.error}`);
  const budgetMs = budgetOf(expected.value.durationMs, test.budgetMultiple);
  input.onReferenceTimed?.({ ms: expected.value.durationMs, budgetMs });
  return ok(judgeLearner(input, shaped, expected.value.shaped.value, budgetMs));
}

function judgeLearner(
  input: ComplexityInput,
  shaped: ShapedValue,
  expected: ShapedValue,
  budgetMs: number,
): TestOutcome {
  const { test } = input;
  const learner = loadFunction(input.learnerCode, input.functionName);
  if (!learner.ok) return erroredOutcome(test.id, learner.error);
  const actual = callTimed(learner.value, [toArgument(shaped)], () => expected.shape);
  if (!actual.ok) return erroredOutcome(test.id, actual.error);
  if (!actual.value.shaped.ok)
    return erroredOutcome(test.id, { message: actual.value.shaped.error });
  if (!shapedEqual(expected, actual.value.shaped.value)) {
    return {
      kind: 'failed',
      testId: test.id,
      args: [shaped],
      expected,
      actual: actual.value.shaped.value,
    };
  }
  const { durationMs } = actual.value;
  return durationMs > budgetMs
    ? { kind: 'too-slow', testId: test.id, durationMs, budgetMs, complexity: test.complexity }
    : { kind: 'passed', testId: test.id, durationMs };
}
