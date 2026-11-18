import { scenesOf } from '@/domain';
import type { Lesson, Step } from '@/domain';
import type { LessonContent, LessonMessages } from './types';
import { validateLessonContent } from './validate-lesson';
import type { ContentIssue } from './validate-lesson';

const baseLesson: Lesson = {
  slug: 'sample-lesson',
  outcomes: ['read-an-array'],
  initialScene: { structures: [], pointers: [], highlights: [] },
  steps: [
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'numbers',
            cells: [
              { id: 'first', value: 1 },
              { id: 'second', value: 2 },
            ],
          },
        },
      ],
    },
    {
      id: 'pick-one',
      kind: 'explain',
      events: [{ type: 'point', pointer: { id: 'cursor', label: 'i', target: null } }],
      check: {
        kind: 'choice',
        id: 'which-first',
        options: ['first-option', 'second-option'],
        correct: 'first-option',
      },
    },
    {
      id: 'find-it',
      kind: 'explain',
      events: [],
      check: {
        kind: 'predict',
        id: 'find-second',
        correct: { structureId: 'numbers', elementId: 'second' },
      },
    },
    {
      id: 'arrange-it',
      kind: 'explain',
      events: [],
      check: { kind: 'order', id: 'arrange', structureId: 'numbers', correct: ['first', 'second'] },
    },
  ],
};

const englishMessages: LessonMessages = {
  title: 'Sample',
  outcomes: { 'read-an-array': 'Read an array' },
  steps: {
    'the-problem': { title: 'The problem', caption: 'Numbers pile up.' },
    'pick-one': { title: 'Pick one', caption: 'Choose.' },
    'find-it': { title: 'Find it', caption: 'Click it.' },
    'arrange-it': { title: 'Arrange it', caption: 'Order it.' },
  },
  checks: {
    'which-first': {
      prompt: 'Which is first?',
      options: { 'first-option': 'The first', 'second-option': 'The second' },
      explanation: 'The first one.',
    },
    'find-second': { prompt: 'Click the second.', explanation: 'Index one.' },
    arrange: { prompt: 'Order them.', explanation: 'Ascending.' },
  },
  terms: { array: { term: 'array', gloss: 'A row of cells.' } },
};

const polishMessages: LessonMessages = {
  title: 'Przykład',
  outcomes: { 'read-an-array': 'Odczytaj tablicę' },
  steps: {
    'the-problem': { title: 'Problem', caption: 'Liczby się piętrzą.' },
    'pick-one': { title: 'Wybierz', caption: 'Wybierz.' },
    'find-it': { title: 'Znajdź', caption: 'Kliknij.' },
    'arrange-it': { title: 'Ułóż', caption: 'Uporządkuj.' },
  },
  checks: {
    'which-first': {
      prompt: 'Który jest pierwszy?',
      options: { 'first-option': 'Pierwszy', 'second-option': 'Drugi' },
      explanation: 'Pierwszy.',
    },
    'find-second': { prompt: 'Kliknij drugi.', explanation: 'Indeks jeden.' },
    arrange: { prompt: 'Uporządkuj.', explanation: 'Rosnąco.' },
  },
  terms: { array: { term: 'array', gloss: 'tablica, rząd komórek.' } },
};

const baseContent: LessonContent = {
  module: 'sample-module',
  lesson: baseLesson,
  terms: ['array'],
  messages: { en: englishMessages, pl: polishMessages },
};

function validate(content: LessonContent): readonly ContentIssue[] {
  const scenes = scenesOf(content.lesson);
  if (!scenes.ok) throw new Error(`fixture does not reduce: ${scenes.error.code}`);
  return validateLessonContent(content, scenes.value);
}

function stepAt(index: number): Step {
  const step = baseLesson.steps[index];
  if (step === undefined) throw new Error(`no fixture step ${String(index)}`);
  return step;
}

function withSteps(steps: readonly Step[]): LessonContent {
  return { ...baseContent, lesson: { ...baseLesson, steps } };
}

function withPolish(overrides: Partial<LessonMessages>): LessonContent {
  return {
    ...baseContent,
    messages: { en: englishMessages, pl: { ...polishMessages, ...overrides } },
  };
}

describe('validateLessonContent', () => {
  it('returns no issues for a valid Lesson', () => {
    expect(validate(baseContent)).toEqual([]);
  });

  it('reports a Locale missing one Step caption', () => {
    const content = withPolish({
      steps: {
        ...polishMessages.steps,
        // @ts-expect-error the caption is deliberately absent
        'find-it': { title: 'Znajdź' },
      },
    });
    expect(validate(content)).toEqual([
      { code: 'missing-message-key', locale: 'pl', path: 'steps.find-it.caption' },
      {
        code: 'locale-key-mismatch',
        path: 'steps.find-it.caption',
        presentIn: 'en',
        absentIn: 'pl',
      },
    ]);
  });

  it('reports a Locale with an extra Check key', () => {
    const content = withPolish({
      checks: { ...polishMessages.checks, 'ghost-check': { prompt: 'x', explanation: 'y' } },
    });
    expect(validate(content)).toEqual([
      { code: 'extra-message-key', locale: 'pl', path: 'checks.ghost-check.prompt' },
      { code: 'extra-message-key', locale: 'pl', path: 'checks.ghost-check.explanation' },
      {
        code: 'locale-key-mismatch',
        path: 'checks.ghost-check.prompt',
        presentIn: 'pl',
        absentIn: 'en',
      },
      {
        code: 'locale-key-mismatch',
        path: 'checks.ghost-check.explanation',
        presentIn: 'pl',
        absentIn: 'en',
      },
    ]);
  });

  it('reports a Choice correct option absent from options', () => {
    const content = withSteps([
      stepAt(0),
      {
        ...stepAt(1),
        check: {
          kind: 'choice',
          id: 'which-first',
          options: ['first-option', 'second-option'],
          correct: 'third-option',
        },
      },
      stepAt(2),
      stepAt(3),
    ]);
    expect(validate(content)).toEqual([
      { code: 'choice-correct-not-in-options', check: 'which-first', correct: 'third-option' },
    ]);
  });

  it('reports an option without a label in one Locale', () => {
    const content = withPolish({
      checks: {
        ...polishMessages.checks,
        'which-first': {
          prompt: 'Który jest pierwszy?',
          options: { 'first-option': 'Pierwszy' },
          explanation: 'Pierwszy.',
        },
      },
    });
    expect(validate(content)).toEqual([
      {
        code: 'choice-option-without-label',
        locale: 'pl',
        check: 'which-first',
        option: 'second-option',
      },
      {
        code: 'locale-key-mismatch',
        path: 'checks.which-first.options.second-option',
        presentIn: 'en',
        absentIn: 'pl',
      },
    ]);
  });

  it('reports a Predict target that exists in a later Step Scene but not in its own', () => {
    const content = withSteps([
      stepAt(0),
      stepAt(1),
      {
        ...stepAt(2),
        check: {
          kind: 'predict',
          id: 'find-second',
          correct: { structureId: 'late', elementId: 'z' },
        },
      },
      {
        ...stepAt(3),
        events: [
          {
            type: 'create',
            structure: { kind: 'array', id: 'late', cells: [{ id: 'z', value: 0 }] },
          },
        ],
      },
    ]);
    expect(validate(content)).toEqual([
      {
        code: 'predict-target-missing',
        step: 'find-it',
        check: 'find-second',
        target: { structureId: 'late', elementId: 'z' },
      },
    ]);
  });

  it('reports a Predict target whose element is missing from an existing Structure', () => {
    const content = withSteps([
      stepAt(0),
      stepAt(1),
      {
        ...stepAt(2),
        check: {
          kind: 'predict',
          id: 'find-second',
          correct: { structureId: 'numbers', elementId: 'ghost' },
        },
      },
      stepAt(3),
    ]);
    expect(validate(content)).toEqual([
      {
        code: 'predict-target-missing',
        step: 'find-it',
        check: 'find-second',
        target: { structureId: 'numbers', elementId: 'ghost' },
      },
    ]);
  });

  it('reports an Order Check whose Structure is missing from the Scene', () => {
    const content = withSteps([
      stepAt(0),
      stepAt(1),
      stepAt(2),
      {
        ...stepAt(3),
        check: { kind: 'order', id: 'arrange', structureId: 'nowhere', correct: ['first'] },
      },
    ]);
    expect(validate(content)).toEqual([
      {
        code: 'order-structure-missing',
        step: 'arrange-it',
        check: 'arrange',
        structure: 'nowhere',
      },
    ]);
  });

  it('reports ids with uppercase or underscores together with their kind', () => {
    const lesson: Lesson = {
      slug: 'Bad_Lesson',
      outcomes: ['read_array'],
      initialScene: {
        structures: [],
        pointers: [{ id: 'Ptr', label: 'p', target: null }],
        highlights: [],
      },
      steps: [
        {
          id: 'Step_One',
          kind: 'problem',
          events: [
            {
              type: 'create',
              structure: { kind: 'array', id: 'My_Array', cells: [{ id: 'Cell', value: 1 }] },
            },
          ],
          check: { kind: 'choice', id: 'Check_One', options: ['Opt_A'], correct: 'Opt_A' },
        },
      ],
    };
    const messages: LessonMessages = {
      title: 't',
      outcomes: { read_array: 'o' },
      steps: { Step_One: { title: 't', caption: 'c' } },
      checks: { Check_One: { prompt: 'p', options: { Opt_A: 'a' }, explanation: 'e' } },
      terms: { Bad_Term: { term: 'x', gloss: 'g' } },
    };
    const content: LessonContent = {
      module: 'Bad_Module',
      lesson,
      terms: ['Bad_Term'],
      messages: { en: messages, pl: messages },
    };
    expect(validate(content)).toEqual([
      { code: 'invalid-id', kind: 'module', id: 'Bad_Module' },
      { code: 'invalid-id', kind: 'lesson', id: 'Bad_Lesson' },
      { code: 'invalid-id', kind: 'outcome', id: 'read_array' },
      { code: 'invalid-id', kind: 'step', id: 'Step_One' },
      { code: 'invalid-id', kind: 'check', id: 'Check_One' },
      { code: 'invalid-id', kind: 'option', id: 'Opt_A' },
      { code: 'invalid-id', kind: 'term', id: 'Bad_Term' },
      { code: 'invalid-id', kind: 'structure', id: 'My_Array' },
      { code: 'invalid-id', kind: 'element', id: 'Cell' },
      { code: 'invalid-id', kind: 'pointer', id: 'Ptr' },
    ]);
  });

  it('reports two Steps with the same id', () => {
    const content = withSteps([
      ...baseLesson.steps,
      { id: 'the-problem', kind: 'explain', events: [] },
    ]);
    expect(validate(content)).toEqual([{ code: 'duplicate-step-id', step: 'the-problem' }]);
  });

  it('reports two Checks with the same id', () => {
    const content = withSteps([
      {
        ...stepAt(0),
        check: { kind: 'order', id: 'arrange', structureId: 'numbers', correct: ['first'] },
      },
      stepAt(1),
      stepAt(2),
      stepAt(3),
    ]);
    expect(validate(content)).toEqual([{ code: 'duplicate-check-id', check: 'arrange' }]);
  });
});
