import type { Exercise, Locale, ShapedValue, TestCase } from '@/domain';
import type { LessonContent } from './types';

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
  | { readonly code: 'complexity-without-hidden-tests' };

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

function isBrokenList(value: ShapedValue): boolean {
  return value.shape === 'linked-list' && value.value !== null && !Array.isArray(value.value);
}

function shapeIssues(test: TestCase): readonly ExerciseIssue[] {
  const paths = [
    ...test.args.flatMap((arg, index) => (isBrokenList(arg) ? [`args.${String(index)}`] : [])),
    ...(isBrokenList(test.expected) ? ['expected'] : []),
  ];
  return paths.map((path): ExerciseIssue => ({
    code: 'invalid-test-shape',
    testId: test.id,
    path,
  }));
}

function escapedForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function declaresFunction(code: string, functionName: string): boolean {
  return new RegExp(`\\bfunction\\s+${escapedForRegExp(functionName)}\\s*\\(`).test(code);
}

function nameIssues(exercise: Exercise): readonly ExerciseIssue[] {
  const { functionName } = exercise;
  const fields = ['starterCode', 'referenceSolution'] as const;
  return fields
    .filter((field) => !declaresFunction(exercise[field], functionName))
    .map((field): ExerciseIssue => ({ code: 'reference-name-mismatch', field, functionName }));
}

function complexityIssues(exercise: Exercise): readonly ExerciseIssue[] {
  return exercise.complexityTest !== undefined && exercise.hiddenTests.length === 0
    ? [{ code: 'complexity-without-hidden-tests' }]
    : [];
}

function definitionIssues(exercise: Exercise): readonly ExerciseIssue[] {
  return [
    ...visibleCountIssues(exercise),
    ...duplicateIssues(exercise),
    ...[...exercise.visibleTests, ...exercise.hiddenTests].flatMap(shapeIssues),
    ...nameIssues(exercise),
    ...complexityIssues(exercise),
  ];
}

export function exerciseIssues(content: LessonContent): readonly ExerciseIssue[] {
  return [
    ...messageIssues(content),
    ...(content.exercise === undefined ? [] : definitionIssues(content.exercise)),
  ];
}
