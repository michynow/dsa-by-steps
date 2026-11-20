import { hasListShape, isStrictJson } from './exercise-values';
import type {
  ComplexityTest,
  Exercise,
  InputGenerator,
  Locale,
  ShapedValue,
  TestCase,
} from '@/domain';
import { termsMarkedIn } from './caption';
import { exerciseMessagesSchema } from './messages-schema';
import type { LessonContent, TermId } from './types';

export type ExerciseIssue =
  | { readonly code: 'exercise-messages-missing'; readonly locale: Locale }
  | { readonly code: 'exercise-without-messages'; readonly locale: Locale }
  | {
      readonly code: 'hint-count-mismatch';
      readonly locale: Locale;
      readonly expected: number;
      readonly actual: number;
    }
  | { readonly code: 'too-few-visible-tests'; readonly count: number }
  | { readonly code: 'duplicate-test-id'; readonly id: string }
  | { readonly code: 'invalid-test-shape'; readonly testId: string; readonly path: string }
  | {
      readonly code: 'reference-name-mismatch';
      readonly field: 'starterCode' | 'referenceSolution';
      readonly functionName: string;
    }
  | { readonly code: 'complexity-without-hidden-tests' }
  | {
      readonly code: 'complexity-arity-mismatch';
      readonly testId: string;
      readonly expected: number;
      readonly actual: number;
    }
  | { readonly code: 'invalid-function-name'; readonly functionName: string }
  | {
      readonly code: 'invalid-complexity-test';
      readonly field: 'budgetMultiple' | 'size' | 'unit' | 'prefix' | 'length';
      readonly value: number | string;
    }
  | { readonly code: 'invalid-test-value'; readonly testId: string; readonly path: string }
  | {
      readonly code: 'exercise-messages-invalid';
      readonly locale: Locale;
      readonly issues: readonly { readonly code: string; readonly path: string }[];
    }
  | {
      readonly code: 'unknown-term';
      readonly locale: Locale;
      readonly path: 'exercise.task';
      readonly term: TermId;
    }
  | {
      readonly code: 'term-locale-mismatch';
      readonly path: 'exercise.task';
      readonly term: TermId;
      readonly presentIn: Locale;
      readonly absentIn: Locale;
    };

const contentLocales: readonly Locale[] = ['en', 'pl'];

const minimumVisibleTests = 3;

export function testIdsOf(exercise: Exercise): readonly string[] {
  return [
    ...exercise.visibleTests.map((test) => test.id),
    ...exercise.hiddenTests.map((test) => test.id),
    ...(exercise.complexityTest === undefined ? [] : [exercise.complexityTest.id]),
  ];
}

function messageIssues(content: LessonContent): readonly ExerciseIssue[] {
  const { exercise } = content;
  return contentLocales.flatMap((locale): readonly ExerciseIssue[] => {
    const messages = content.messages[locale].exercise;
    if (exercise === undefined) {
      return messages === undefined ? [] : [{ code: 'exercise-without-messages', locale }];
    }
    if (messages === undefined) return [{ code: 'exercise-messages-missing', locale }];
    const parsed = exerciseMessagesSchema.safeParse(messages);
    if (!parsed.success) {
      const issues = parsed.error.issues.map(({ code, path }) => ({
        code,
        path: path.map(String).join('.'),
      }));
      return [{ code: 'exercise-messages-invalid', locale, issues }];
    }
    return messages.hints.length === exercise.hintCount
      ? []
      : [
          {
            code: 'hint-count-mismatch',
            locale,
            expected: exercise.hintCount,
            actual: messages.hints.length,
          },
        ];
  });
}

function visibleCountIssues(exercise: Exercise): readonly ExerciseIssue[] {
  const count = exercise.visibleTests.length;
  return count < minimumVisibleTests ? [{ code: 'too-few-visible-tests', count }] : [];
}

function duplicateIssues(exercise: Exercise): readonly ExerciseIssue[] {
  const ids = testIdsOf(exercise);
  return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].map(
    (id): ExerciseIssue => ({ code: 'duplicate-test-id', id }),
  );
}

function shapedValuesOf(test: TestCase): readonly (readonly [string, ShapedValue])[] {
  return [
    ...test.args.map((arg, index): readonly [string, ShapedValue] => [
      `args.${String(index)}`,
      arg,
    ]),
    ['expected', test.expected],
  ];
}

function shapeIssues(test: TestCase): readonly ExerciseIssue[] {
  return shapedValuesOf(test).flatMap(([path, shaped]): readonly ExerciseIssue[] => [
    ...(hasListShape(shaped)
      ? []
      : [{ code: 'invalid-test-shape' as const, testId: test.id, path }]),
    ...(isStrictJson(shaped.value)
      ? []
      : [{ code: 'invalid-test-value' as const, testId: test.id, path }]),
  ]);
}

const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function escapedForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function declaresFunction(code: string, functionName: string): boolean {
  return new RegExp(
    `^\\s*(?:export\\s+)?function\\s+${escapedForRegExp(functionName)}\\s*[<(]`,
    'm',
  ).test(code);
}

function nameIssues(exercise: Exercise): readonly ExerciseIssue[] {
  const { functionName } = exercise;
  if (!identifier.test(functionName)) return [{ code: 'invalid-function-name', functionName }];
  const fields = ['starterCode', 'referenceSolution'] as const;
  return fields
    .filter((field) => !declaresFunction(exercise[field], functionName))
    .map((field): ExerciseIssue => ({ code: 'reference-name-mismatch', field, functionName }));
}

const minimumBudgetMultiple = 5;
const maximumBudgetMultiple = 10;
const minimumGeneratorSize = 1000;

function budgetIssues(test: ComplexityTest): readonly ExerciseIssue[] {
  const value = test.budgetMultiple;
  const valid =
    Number.isInteger(value) && value >= minimumBudgetMultiple && value <= maximumBudgetMultiple;
  return valid ? [] : [{ code: 'invalid-complexity-test', field: 'budgetMultiple', value }];
}

const maximumGeneratorTextLength = 16;
const maximumRepeatedLength = 2_000_000;

function sizeIssues(test: ComplexityTest): readonly ExerciseIssue[] {
  const value = test.generator.size;
  return Number.isInteger(value) && value >= minimumGeneratorSize
    ? []
    : [{ code: 'invalid-complexity-test', field: 'size', value }];
}

function textIssues(field: 'unit' | 'prefix', value: string): readonly ExerciseIssue[] {
  return value.length >= 1 && value.length <= maximumGeneratorTextLength
    ? []
    : [{ code: 'invalid-complexity-test', field, value }];
}

function lengthIssues(value: number): readonly ExerciseIssue[] {
  return value > maximumRepeatedLength
    ? [{ code: 'invalid-complexity-test', field: 'length', value }]
    : [];
}

function generatorTextIssues(generator: InputGenerator): readonly ExerciseIssue[] {
  switch (generator.kind) {
    case 'range':
    case 'linked-list-range':
      return [];
    case 'string-range':
      return textIssues('prefix', generator.prefix);
    case 'repeat-string': {
      const length = generator.unit.length * generator.size;
      return [...textIssues('unit', generator.unit), ...lengthIssues(length)];
    }
  }
}

function complexityIssues(exercise: Exercise): readonly ExerciseIssue[] {
  return exercise.complexityTest !== undefined && exercise.hiddenTests.length === 0
    ? [{ code: 'complexity-without-hidden-tests' }]
    : [];
}

function complexityArityIssues(exercise: Exercise): readonly ExerciseIssue[] {
  const test = exercise.complexityTest;
  const expected = exercise.visibleTests[0]?.args.length;
  if (test === undefined || expected === undefined) return [];
  const actual = 1 + (test.extraArgs?.length ?? 0);
  return actual === expected
    ? []
    : [{ code: 'complexity-arity-mismatch', testId: test.id, expected, actual }];
}

function complexityValueIssues(exercise: Exercise): readonly ExerciseIssue[] {
  const test = exercise.complexityTest;
  return test === undefined
    ? []
    : [...budgetIssues(test), ...sizeIssues(test), ...generatorTextIssues(test.generator)];
}

function definitionIssues(exercise: Exercise): readonly ExerciseIssue[] {
  return [
    ...visibleCountIssues(exercise),
    ...duplicateIssues(exercise),
    ...[...exercise.visibleTests, ...exercise.hiddenTests].flatMap(shapeIssues),
    ...nameIssues(exercise),
    ...complexityIssues(exercise),
    ...complexityValueIssues(exercise),
    ...complexityArityIssues(exercise),
  ];
}

function taskTerms(content: LessonContent, locale: Locale): readonly TermId[] {
  return termsMarkedIn(content.messages[locale].exercise?.task);
}

export function exerciseTaskTerms(content: LessonContent): readonly TermId[] {
  return contentLocales.flatMap((locale) => taskTerms(content, locale));
}

function unknownTermIssues(content: LessonContent): readonly ExerciseIssue[] {
  return contentLocales.flatMap((locale) =>
    [...new Set(taskTerms(content, locale))]
      .filter((term) => !content.terms.includes(term))
      .map((term): ExerciseIssue => ({
        code: 'unknown-term',
        locale,
        path: 'exercise.task',
        term,
      })),
  );
}

function mismatchedTermIssues(content: LessonContent): readonly ExerciseIssue[] {
  if (content.messages.en.exercise === undefined || content.messages.pl.exercise === undefined) {
    return [];
  }
  return contentLocales.flatMap((presentIn) =>
    contentLocales
      .filter((absentIn) => absentIn !== presentIn)
      .flatMap((absentIn) =>
        [...new Set(taskTerms(content, presentIn))]
          .filter((term) => !taskTerms(content, absentIn).includes(term))
          .map((term): ExerciseIssue => ({
            code: 'term-locale-mismatch',
            path: 'exercise.task',
            term,
            presentIn,
            absentIn,
          })),
      ),
  );
}

export function exerciseIssues(content: LessonContent): readonly ExerciseIssue[] {
  return [
    ...messageIssues(content),
    ...unknownTermIssues(content),
    ...mismatchedTermIssues(content),
    ...(content.exercise === undefined ? [] : definitionIssues(content.exercise)),
  ];
}
