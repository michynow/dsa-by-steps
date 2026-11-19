import type { Result, TestCase, TestOutcome } from '@/domain';
import { err, ok } from '@/domain';
import { ListNode, shapedEqual, toArgument, toShaped } from './values';

export interface ExecuteInput {
  readonly code: string;
  readonly functionName: string;
  readonly tests: readonly TestCase[];
}

export type Callable = (...args: readonly unknown[]) => unknown;

export interface TimedCall {
  readonly result: unknown;
  readonly durationMs: number;
}

export function messageOf(thrown: unknown): string {
  return thrown instanceof Error ? thrown.message : String(thrown);
}

export function loadFunction(code: string, functionName: string): Result<Callable, string> {
  try {
    const body = `${code}\nreturn typeof ${functionName} === 'function' ? ${functionName} : undefined;`;
    const factory = new Function('ListNode', body);
    const loaded: unknown = Reflect.apply(factory, undefined, [ListNode]);
    return typeof loaded === 'function'
      ? ok((...args): unknown => Reflect.apply(loaded, undefined, args))
      : err(`Function ${functionName} is not defined`);
  } catch (thrown) {
    return err(messageOf(thrown));
  }
}

export function callTimed(fn: Callable, args: readonly unknown[]): Result<TimedCall, string> {
  try {
    const start = performance.now();
    const result = fn(...args);
    return ok({ result, durationMs: performance.now() - start });
  } catch (thrown) {
    return err(messageOf(thrown));
  }
}

function runTest(fn: Callable, test: TestCase): TestOutcome {
  const call = callTimed(fn, test.args.map(toArgument));
  if (!call.ok) return { kind: 'errored', testId: test.id, message: call.error };
  const actual = toShaped(call.value.result, test.expected.shape);
  if (!actual.ok) return { kind: 'errored', testId: test.id, message: actual.error };
  return shapedEqual(actual.value, test.expected)
    ? { kind: 'passed', testId: test.id, durationMs: call.value.durationMs }
    : {
        kind: 'failed',
        testId: test.id,
        args: test.args,
        expected: test.expected,
        actual: actual.value,
      };
}

export function executeTests(input: ExecuteInput): readonly TestOutcome[] {
  const loaded = loadFunction(input.code, input.functionName);
  if (!loaded.ok) {
    return input.tests.map((test) => ({ kind: 'errored', testId: test.id, message: loaded.error }));
  }
  return input.tests.map((test) => runTest(loaded.value, test));
}
