import { z } from 'zod';
import type { ComplexityTest, Result, RunMode, RunReport, ShapedValue, TestCase } from '@/domain';
import type { CompileError } from './types';
import { err, isShapedValue, ok } from '@/domain';

export const protocolVersion = 1;

export interface RunRequest {
  readonly version: 1;
  readonly type: 'run';
  readonly mode: RunMode;
  readonly exercise: {
    readonly functionName: string;
    readonly visibleTests: readonly TestCase[];
    readonly hiddenTests: readonly TestCase[];
    readonly complexityTest?: ComplexityTest | undefined;
    readonly referenceSolution: string;
  };
  readonly code: string;
}

export type RunResponse =
  | { readonly version: 1; readonly type: 'report'; readonly report: RunReport }
  | { readonly version: 1; readonly type: 'compile-error'; readonly error: CompileError };

const version = z.literal(protocolVersion);
const shapedValue = z.custom<ShapedValue>(isShapedValue);

const testCase = z.strictObject({
  id: z.string(),
  args: z.array(shapedValue),
  expected: shapedValue,
});

const complexityTest = z.strictObject({
  id: z.string(),
  generator: z.strictObject({
    kind: z.enum(['range', 'linked-list-range']),
    size: z.number(),
  }),
  expected: z.literal('reference'),
  budgetMultiple: z.number(),
  complexity: z.string(),
});

const runRequest: z.ZodType<RunRequest> = z.strictObject({
  version,
  type: z.literal('run'),
  mode: z.enum(['run', 'submit']),
  exercise: z.strictObject({
    functionName: z.string(),
    visibleTests: z.array(testCase),
    hiddenTests: z.array(testCase),
    complexityTest: complexityTest.optional(),
    referenceSolution: z.string(),
  }),
  code: z.string(),
});

const testOutcome = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('passed'), testId: z.string(), durationMs: z.number() }),
  z.strictObject({
    kind: z.literal('failed'),
    testId: z.string(),
    args: z.array(shapedValue),
    expected: shapedValue,
    actual: shapedValue,
  }),
  z.strictObject({ kind: z.literal('errored'), testId: z.string(), message: z.string() }),
  z.strictObject({ kind: z.literal('timed-out'), testId: z.string(), limitMs: z.number() }),
  z.strictObject({
    kind: z.literal('too-slow'),
    testId: z.string(),
    durationMs: z.number(),
    budgetMs: z.number(),
    complexity: z.string(),
  }),
]);

const runResponse: z.ZodType<RunResponse> = z.discriminatedUnion('type', [
  z.strictObject({
    version,
    type: z.literal('report'),
    report: z.strictObject({
      mode: z.enum(['run', 'submit']),
      outcomes: z.array(testOutcome),
      passed: z.boolean(),
    }),
  }),
  z.strictObject({
    version,
    type: z.literal('compile-error'),
    error: z.strictObject({ message: z.string(), line: z.number(), column: z.number() }),
  }),
]);

function describeIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}

function parseWith<T>(schema: z.ZodType<T>, data: unknown): Result<T, string> {
  const parsed = schema.safeParse(data);
  return parsed.success ? ok(parsed.data) : err(describeIssues(parsed.error));
}

export function parseRunRequest(data: unknown): Result<RunRequest, string> {
  return parseWith(runRequest, data);
}

export function parseRunResponse(data: unknown): Result<RunResponse, string> {
  return parseWith(runResponse, data);
}
