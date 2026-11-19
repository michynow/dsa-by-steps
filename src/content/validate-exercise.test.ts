import { scenesOf } from '@/domain';
import type { ComplexityTest, Exercise, TestCase } from '@/domain';
import { templateContent } from './_template';
import type { ExerciseMessages, LessonContent, LessonMessages } from './types';
import { validateLessonContent } from './validate-lesson';
import type { ContentIssue } from './validate-lesson';

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('template has no exercise');
  return value;
}

const exercise = required(templateContent.exercise);
const english = templateContent.messages.en;
const polish = templateContent.messages.pl;
const englishExercise = required(english.exercise);
const polishExercise = required(polish.exercise);

function validate(content: LessonContent): readonly ContentIssue[] {
  const scenes = scenesOf(content.lesson);
  if (!scenes.ok) throw new Error(`fixture does not reduce: ${scenes.error.code}`);
  return validateLessonContent(content, scenes.value);
}

function withoutExerciseMessages(messages: LessonMessages): LessonMessages {
  const { title, story, uses, whenNot, outcomes, steps, checks, terms } = messages;
  return { title, story, uses, whenNot, outcomes, steps, checks, terms };
}

function withoutExercise(content: LessonContent): LessonContent {
  const { module, lesson, terms, messages } = content;
  return {
    module,
    lesson,
    terms,
    messages: {
      en: withoutExerciseMessages(messages.en),
      pl: withoutExerciseMessages(messages.pl),
    },
  };
}

function withExercise(
  changed: Partial<Exercise>,
  messages: { readonly en?: ExerciseMessages; readonly pl?: ExerciseMessages } = {},
): LessonContent {
  return {
    ...templateContent,
    exercise: { ...exercise, ...changed },
    messages: {
      en: { ...english, exercise: messages.en ?? englishExercise },
      pl: { ...polish, exercise: messages.pl ?? polishExercise },
    },
  };
}

const complexity = (changes: Partial<ComplexityTest>): ComplexityTest => ({
  id: 'large-input',
  generator: { kind: 'range', size: 1000 },
  expected: 'reference',
  budgetMultiple: 5,
  complexity: 'O(n)',
  ...changes,
});

const listTest = (id: string): TestCase => ({
  id,
  args: [{ shape: 'linked-list', value: [1, 2] }],
  expected: { shape: 'linked-list', value: [2, 1] },
});

describe('validateLessonContent exercise', () => {
  it('accepts a Lesson without an exercise', () => {
    expect(validate(withoutExercise(templateContent))).toEqual([]);
  });

  it('accepts the template exercise', () => {
    expect(validate(templateContent)).toEqual([]);
  });

  it('reports a Locale without exercise messages', () => {
    expect(
      validate({
        ...templateContent,
        messages: { en: english, pl: withoutExerciseMessages(polish) },
      }),
    ).toEqual([{ code: 'exercise-messages-missing', locale: 'pl' }]);
  });

  it('reports exercise messages without an exercise', () => {
    expect(
      validate({ ...withoutExercise(templateContent), messages: templateContent.messages }),
    ).toEqual([
      { code: 'exercise-without-messages', locale: 'en' },
      { code: 'exercise-without-messages', locale: 'pl' },
    ]);
  });

  it('reports a hint count that differs from the declared one', () => {
    expect(validate(withExercise({}, { pl: { ...polishExercise, hints: ['Jedna'] } }))).toEqual([
      { code: 'hint-count-mismatch', locale: 'pl', expected: 2, actual: 1 },
    ]);
  });

  it('reports fewer than three visible tests', () => {
    expect(validate(withExercise({ visibleTests: exercise.visibleTests.slice(0, 2) }))).toEqual([
      { code: 'too-few-visible-tests', count: 2 },
    ]);
  });

  it('reports a test id used twice across visible and hidden tests', () => {
    const repeated: TestCase = { ...listTest('two-numbers'), id: 'two-numbers' };
    expect(validate(withExercise({ hiddenTests: [repeated] }))).toEqual([
      { code: 'duplicate-test-id', id: 'two-numbers' },
    ]);
  });

  it('reports a test id that is not kebab-case', () => {
    expect(validate(withExercise({ hiddenTests: [listTest('Four')] }))).toEqual([
      { code: 'invalid-id', kind: 'test', id: 'Four' },
    ]);
  });

  it('reports a linked-list argument that is not an array', () => {
    const broken: TestCase = { ...listTest('four'), args: [{ shape: 'linked-list', value: 4 }] };
    expect(validate(withExercise({ hiddenTests: [broken] }))).toEqual([
      { code: 'invalid-test-shape', testId: 'four', path: 'args.0' },
    ]);
  });

  it('reports a linked-list expected value that is not an array', () => {
    const broken: TestCase = {
      ...listTest('four'),
      expected: { shape: 'linked-list', value: 'x' },
    };
    expect(validate(withExercise({ hiddenTests: [broken] }))).toEqual([
      { code: 'invalid-test-shape', testId: 'four', path: 'expected' },
    ]);
  });

  it('accepts null and array linked-list values', () => {
    const empty: TestCase = {
      id: 'four',
      args: [{ shape: 'linked-list', value: null }],
      expected: { shape: 'linked-list', value: [] },
    };
    expect(validate(withExercise({ hiddenTests: [empty, listTest('five')] }))).toEqual([]);
  });

  it('reports a Reference Solution that declares the name as a constant', () => {
    expect(
      validate(withExercise({ referenceSolution: 'const secondNumber = (xs) => xs[1];\n' })),
    ).toEqual([
      { code: 'reference-name-mismatch', field: 'referenceSolution', functionName: 'secondNumber' },
    ]);
  });

  it('reports Starter Code that declares a longer function name', () => {
    expect(validate(withExercise({ starterCode: 'function secondNumberX(xs) {}\n' }))).toEqual([
      { code: 'reference-name-mismatch', field: 'starterCode', functionName: 'secondNumber' },
    ]);
  });

  it('reports Starter Code that declares a shorter function name', () => {
    expect(validate(withExercise({ starterCode: 'function xsecondNumber(xs) {}\n' }))).toEqual([
      { code: 'reference-name-mismatch', field: 'starterCode', functionName: 'secondNumber' },
    ]);
  });

  it('reports a Complexity Test without hidden tests', () => {
    expect(
      validate(
        withExercise({
          hiddenTests: [],
          complexityTest: {
            id: 'large-input',
            generator: { kind: 'range', size: 1000 },
            expected: 'reference',
            budgetMultiple: 5,
            complexity: 'O(n)',
          },
        }),
      ),
    ).toEqual([{ code: 'complexity-without-hidden-tests' }]);
  });

  it('reports a malformed marker in the task', () => {
    expect(
      validate(withExercise({}, { en: { ...englishExercise, task: 'Return [[Array]].' } })),
    ).toEqual([
      { code: 'malformed-marker', locale: 'en', path: 'exercise.task', text: '[[Array]]' },
      {
        code: 'term-locale-mismatch',
        path: 'exercise.task',
        term: 'array',
        presentIn: 'pl',
        absentIn: 'en',
      },
    ]);
  });

  it('reports a marker in an exercise hint', () => {
    expect(
      validate(
        withExercise({}, { en: { ...englishExercise, hints: ['See [[array]]', 'Second'] } }),
      ),
    ).toEqual([{ code: 'marker-outside-caption', locale: 'en', path: 'exercise.hints.0' }]);
  });

  it('reports a hint count mismatch in English only', () => {
    expect(validate(withExercise({}, { en: { ...englishExercise, hints: ['One'] } }))).toEqual([
      { code: 'hint-count-mismatch', locale: 'en', expected: 2, actual: 1 },
    ]);
  });

  it('reports a hint count mismatch in Polish only', () => {
    expect(
      validate(withExercise({}, { pl: { ...polishExercise, hints: ['a', 'b', 'c'] } })),
    ).toEqual([{ code: 'hint-count-mismatch', locale: 'pl', expected: 2, actual: 3 }]);
  });

  it('reports a linked-list value that is an object', () => {
    const broken: TestCase = {
      ...listTest('four'),
      args: [{ shape: 'linked-list', value: { head: 1 } }],
    };
    expect(validate(withExercise({ hiddenTests: [broken] }))).toEqual([
      { code: 'invalid-test-shape', testId: 'four', path: 'args.0' },
    ]);
  });

  it('reports Starter Code that declares the function as a class method or arrow', () => {
    const issue = {
      code: 'reference-name-mismatch',
      field: 'starterCode',
      functionName: 'secondNumber',
    };
    expect(
      validate(withExercise({ starterCode: 'class A {\n  secondNumber(xs) {}\n}\n' })),
    ).toEqual([issue]);
    expect(
      validate(withExercise({ starterCode: 'const f = (xs) => secondNumber(xs);\n' })),
    ).toEqual([issue]);
  });

  it('reports a declaration that only appears in a comment or string', () => {
    const issue = {
      code: 'reference-name-mismatch',
      field: 'starterCode',
      functionName: 'secondNumber',
    };
    expect(
      validate(withExercise({ starterCode: '// function secondNumber(xs) {}\nconst a = 1;\n' })),
    ).toEqual([issue]);
    expect(
      validate(withExercise({ starterCode: 'const a = "function secondNumber(xs) {}";\n' })),
    ).toEqual([issue]);
  });

  it('reports an async declaration', () => {
    expect(validate(withExercise({ starterCode: 'async function secondNumber(xs) {}\n' }))).toEqual(
      [{ code: 'reference-name-mismatch', field: 'starterCode', functionName: 'secondNumber' }],
    );
  });

  it('accepts an exported, generic and indented declaration', () => {
    expect(
      validate(
        withExercise({
          starterCode: 'export function secondNumber<T>(xs: T[]): T {\n  return xs[0]!;\n}\n',
          referenceSolution: '\n  function secondNumber (xs) {\n  return xs[1];\n}\n',
        }),
      ),
    ).toEqual([]);
  });

  it('reports a function name that is not an identifier', () => {
    expect(validate(withExercise({ functionName: 'second number' }))).toEqual([
      { code: 'invalid-function-name', functionName: 'second number' },
    ]);
  });

  it('reports a Complexity Test id that collides with a visible test id', () => {
    expect(validate(withExercise({ complexityTest: complexity({ id: 'two-numbers' }) }))).toEqual([
      { code: 'duplicate-test-id', id: 'two-numbers' },
    ]);
  });

  it('accepts a valid Complexity Test', () => {
    expect(validate(withExercise({ complexityTest: complexity({}) }))).toEqual([]);
  });

  it.each([4, 11, 5.5])('reports a budget multiple of %s', (value) => {
    expect(
      validate(withExercise({ complexityTest: complexity({ budgetMultiple: value }) })),
    ).toEqual([{ code: 'invalid-complexity-test', field: 'budgetMultiple', value }]);
  });

  it.each([999, 1000.5])('reports a generator size of %s', (value) => {
    expect(
      validate(
        withExercise({ complexityTest: complexity({ generator: { kind: 'range', size: value } }) }),
      ),
    ).toEqual([{ code: 'invalid-complexity-test', field: 'size', value }]);
  });

  it.each([5, 10])('accepts a budget multiple of %s', (value) => {
    expect(
      validate(withExercise({ complexityTest: complexity({ budgetMultiple: value }) })),
    ).toEqual([]);
  });

  it('reports non-finite and non-plain test values', () => {
    const broken: TestCase = {
      id: 'four',
      args: [
        { shape: 'value', value: Number.NaN },
        { shape: 'value', value: new Date(0) as never },
      ],
      expected: { shape: 'value', value: [Number.POSITIVE_INFINITY] },
    };
    expect(validate(withExercise({ hiddenTests: [broken] }))).toEqual([
      { code: 'invalid-test-value', testId: 'four', path: 'args.0' },
      { code: 'invalid-test-value', testId: 'four', path: 'args.1' },
      { code: 'invalid-test-value', testId: 'four', path: 'expected' },
    ]);
  });

  it('reports exercise messages with an extra key', () => {
    const extra = { ...polishExercise, extra: 'x' };
    expect(validate(withExercise({}, { pl: extra }))).toEqual([
      {
        code: 'exercise-messages-invalid',
        locale: 'pl',
        issues: [{ code: 'unrecognized_keys', path: '' }],
      },
    ]);
  });

  it('reports exercise messages with an empty hint', () => {
    const empty = { ...englishExercise, hints: ['', 'Two'] };
    expect(validate(withExercise({}, { en: empty }))).toEqual([
      {
        code: 'exercise-messages-invalid',
        locale: 'en',
        issues: [{ code: 'too_small', path: 'hints.0' }],
      },
    ]);
  });
});

describe('validateLessonContent exercise Terms', () => {
  const glossary = { term: 'glossary', gloss: 'A list of words.' };

  function withTask(en: string, pl: string, terms: readonly string[] = ['array', 'glossary']) {
    return {
      ...templateContent,
      terms,
      messages: {
        en: {
          ...english,
          terms: { ...english.terms, glossary },
          exercise: { ...englishExercise, task: en },
        },
        pl: {
          ...polish,
          terms: { ...polish.terms, glossary },
          exercise: { ...polishExercise, task: pl },
        },
      },
    };
  }

  it('counts a Term marked only in the task as used', () => {
    expect(validate(withTask('Use a [[glossary]].', 'Użyj [[glossary]].'))).toEqual([]);
  });

  it('reports a Term never marked in a Step or a task as unused', () => {
    expect(validate(withTask('Plain.', 'Zwykłe.'))).toEqual([
      { code: 'unused-term', term: 'glossary' },
    ]);
  });

  it('reports an unknown Term in a task in every Locale', () => {
    expect(validate(withTask('A [[ghost]] [[glossary]].', 'Zły [[ghost]] [[glossary]].'))).toEqual([
      { code: 'unknown-term', locale: 'en', path: 'exercise.task', term: 'ghost' },
      { code: 'unknown-term', locale: 'pl', path: 'exercise.task', term: 'ghost' },
    ]);
  });

  it('reports a Term marked in the English task only', () => {
    expect(validate(withTask('A [[glossary]].', 'Zwykłe.'))).toEqual([
      {
        code: 'term-locale-mismatch',
        path: 'exercise.task',
        term: 'glossary',
        presentIn: 'en',
        absentIn: 'pl',
      },
    ]);
  });
});
