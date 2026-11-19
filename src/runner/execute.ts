import type { ErroredReason, Result, ShapedValue, TestCase, TestOutcome } from '@/domain';
import { err, ok } from '@/domain';
import { intrinsics } from './intrinsics';
import { ListNode, shapedEqual, toArgument, toShaped } from './values';

export interface ExecuteInput {
  readonly code: string;
  readonly functionName: string;
  readonly tests: readonly TestCase[];
}

export interface TestObserver {
  readonly started: (testId: string) => void;
  readonly outcome: (outcome: TestOutcome) => void;
}

export type Callable = (...args: readonly unknown[]) => unknown;

export interface Failure {
  readonly message: string;
  readonly reason?: ErroredReason;
}

export interface Timed {
  readonly shaped: Result<ShapedValue, string>;
  readonly durationMs: number;
}

const stackOverflowPattern = /call stack|too much recursion/i;

export function failureOf(thrown: unknown): Failure {
  const message = thrown instanceof Error ? thrown.message : String(thrown);
  return thrown instanceof Error && stackOverflowPattern.test(message)
    ? { message: 'Maximum call stack size exceeded', reason: 'stack-overflow' }
    : { message };
}

export function erroredOutcome(testId: string, failure: Failure): TestOutcome {
  return failure.reason === undefined
    ? { kind: 'errored', testId, message: failure.message }
    : { kind: 'errored', testId, message: failure.message, reason: failure.reason };
}

export function loadFunction(code: string, functionName: string): Result<Callable, Failure> {
  try {
    const body = `${code}\nreturn typeof ${functionName} === 'function' ? ${functionName} : undefined;`;
    const factory = new Function('ListNode', body);
    const loaded: unknown = intrinsics.apply(factory, undefined, [ListNode]);
    return typeof loaded === 'function'
      ? ok((...args): unknown => intrinsics.apply(loaded, undefined, args))
      : err({ message: `Function ${functionName} is not defined` });
  } catch (thrown) {
    return err(failureOf(thrown));
  }
}

export function callTimed(
  fn: Callable,
  args: readonly unknown[],
  shapeOf: (result: unknown) => ShapedValue['shape'],
): Result<Timed, Failure> {
  try {
    const start = intrinsics.now();
    const result = fn(...args);
    const shaped = toShaped(result, shapeOf(result));
    return ok({ shaped, durationMs: intrinsics.now() - start });
  } catch (thrown) {
    return err(failureOf(thrown));
  }
}

function runTest(fn: Callable, test: TestCase): TestOutcome {
  const call = callTimed(fn, test.args.map(toArgument), () => test.expected.shape);
  if (!call.ok) return erroredOutcome(test.id, call.error);
  const { shaped, durationMs } = call.value;
  if (!shaped.ok) return erroredOutcome(test.id, { message: shaped.error });
  return shapedEqual(shaped.value, test.expected)
    ? { kind: 'passed', testId: test.id, durationMs }
    : {
        kind: 'failed',
        testId: test.id,
        args: test.args,
        expected: test.expected,
        actual: shaped.value,
      };
}

export function executeTestsStreaming(input: ExecuteInput, observer: TestObserver): void {
  const loaded = loadFunction(input.code, input.functionName);
  for (const test of input.tests) {
    observer.started(test.id);
    observer.outcome(
      loaded.ok ? runTest(loaded.value, test) : erroredOutcome(test.id, loaded.error),
    );
  }
}

export function executeTests(input: ExecuteInput): readonly TestOutcome[] {
  const outcomes: TestOutcome[] = [];
  executeTestsStreaming(input, {
    started: () => undefined,
    outcome: (outcome) => outcomes.push(outcome),
  });
  return outcomes;
}
