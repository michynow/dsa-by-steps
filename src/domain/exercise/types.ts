export type JsonValue =
  null | boolean | number | string | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export type ValueShape = 'value' | 'linked-list';

export interface ShapedValue {
  readonly shape: ValueShape;
  readonly value: JsonValue;
}

export interface TestCase {
  readonly id: string;
  readonly args: readonly ShapedValue[];
  readonly expected: ShapedValue;
}

export type InputGenerator =
  | { readonly kind: 'range'; readonly size: number }
  | { readonly kind: 'linked-list-range'; readonly size: number }
  | { readonly kind: 'repeat-string'; readonly unit: string; readonly size: number }
  | { readonly kind: 'string-range'; readonly prefix: string; readonly size: number };

export interface ComplexityTest {
  readonly id: string;
  readonly generator: InputGenerator;
  readonly extraArgs?: readonly ShapedValue[] | undefined;
  readonly expected: 'reference';
  readonly budgetMultiple: number;
  readonly complexity: string;
}

export interface Exercise {
  readonly functionName: string;
  readonly starterCode: string;
  readonly referenceSolution: string;
  readonly visibleTests: readonly TestCase[];
  readonly hiddenTests: readonly TestCase[];
  readonly complexityTest?: ComplexityTest;
  readonly hintCount: number;
}

export type ErroredReason = 'stack-overflow';

export type TestOutcome =
  | { readonly kind: 'passed'; readonly testId: string; readonly durationMs: number }
  | {
      readonly kind: 'failed';
      readonly testId: string;
      readonly args: readonly ShapedValue[];
      readonly expected: ShapedValue;
      readonly actual: ShapedValue;
    }
  | {
      readonly kind: 'errored';
      readonly testId: string;
      readonly message: string;
      readonly reason?: ErroredReason | undefined;
    }
  | { readonly kind: 'skipped'; readonly testId: string }
  | { readonly kind: 'timed-out'; readonly testId: string; readonly limitMs: number }
  | {
      readonly kind: 'too-slow';
      readonly testId: string;
      readonly durationMs: number;
      readonly budgetMs: number;
      readonly complexity: string;
    };

export type RunMode = 'run' | 'submit';

export interface RunReport {
  readonly mode: RunMode;
  readonly outcomes: readonly TestOutcome[];
  readonly passed: boolean;
}
