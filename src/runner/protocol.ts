import { z } from 'zod';
import type { ComplexityTest, Result, ShapedValue, TestCase, TestOutcome } from '@/domain';
import { err, isShapedValue, ok } from '@/domain';

export const protocolVersion = 1;

interface Tagged {
  readonly version: 1;
  readonly nonce: string;
}

export type RunRequest =
  | (Tagged & {
      readonly type: 'run-tests';
      readonly functionName: string;
      readonly code: string;
      readonly tests: readonly TestCase[];
    })
  | (Tagged & {
      readonly type: 'run-complexity';
      readonly functionName: string;
      readonly learnerCode: string;
      readonly referenceCode: string;
      readonly test: ComplexityTest;
    });

export type RunResponse =
  | (Tagged & { readonly type: 'test-started'; readonly testId: string })
  | (Tagged & { readonly type: 'outcome'; readonly outcome: TestOutcome })
  | (Tagged & {
      readonly type: 'reference-timed';
      readonly ms: number;
      readonly budgetMs: number;
    })
  | (Tagged & { readonly type: 'internal-error'; readonly message: string })
  | (Tagged & { readonly type: 'done' });

const tagged = { version: z.literal(protocolVersion), nonce: z.string() };
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

const runRequest: z.ZodType<RunRequest> = z.discriminatedUnion('type', [
  z.strictObject({
    ...tagged,
    type: z.literal('run-tests'),
    functionName: z.string(),
    code: z.string(),
    tests: z.array(testCase),
  }),
  z.strictObject({
    ...tagged,
    type: z.literal('run-complexity'),
    functionName: z.string(),
    learnerCode: z.string(),
    referenceCode: z.string(),
    test: complexityTest,
  }),
]);

const testOutcome: z.ZodType<TestOutcome> = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('passed'), testId: z.string(), durationMs: z.number() }),
  z.strictObject({
    kind: z.literal('failed'),
    testId: z.string(),
    args: z.array(shapedValue),
    expected: shapedValue,
    actual: shapedValue,
  }),
  z.strictObject({
    kind: z.literal('errored'),
    testId: z.string(),
    message: z.string(),
    reason: z.literal('stack-overflow').optional(),
  }),
  z.strictObject({ kind: z.literal('skipped'), testId: z.string() }),
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
  z.strictObject({ ...tagged, type: z.literal('test-started'), testId: z.string() }),
  z.strictObject({ ...tagged, type: z.literal('outcome'), outcome: testOutcome }),
  z.strictObject({
    ...tagged,
    type: z.literal('reference-timed'),
    ms: z.number(),
    budgetMs: z.number(),
  }),
  z.strictObject({ ...tagged, type: z.literal('internal-error'), message: z.string() }),
  z.strictObject({ ...tagged, type: z.literal('done') }),
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
