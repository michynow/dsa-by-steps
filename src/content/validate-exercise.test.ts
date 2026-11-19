import { scenesOf } from '@/domain';
import type { Exercise, TestCase } from '@/domain';
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
            budgetMultiple: 4,
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
    ]);
  });

  it('reports a marker in an exercise hint', () => {
    expect(
      validate(
        withExercise({}, { en: { ...englishExercise, hints: ['See [[array]]', 'Second'] } }),
      ),
    ).toEqual([{ code: 'marker-outside-caption', locale: 'en', path: 'exercise.hints.0' }]);
  });
});
