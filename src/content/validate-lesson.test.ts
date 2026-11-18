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
    const arrange: Step['check'] = {
      kind: 'order',
      id: 'arrange',
      structureId: 'numbers',
      correct: ['first'],
    };
    const content = withSteps([stepAt(0), stepAt(1), { ...stepAt(2), check: arrange }, stepAt(3)]);
    expect(validate(content)).toEqual([
      { code: 'duplicate-check-id', check: 'arrange' },
      { code: 'extra-message-key', locale: 'en', path: 'checks.find-second.prompt' },
      { code: 'extra-message-key', locale: 'en', path: 'checks.find-second.explanation' },
      { code: 'extra-message-key', locale: 'pl', path: 'checks.find-second.prompt' },
      { code: 'extra-message-key', locale: 'pl', path: 'checks.find-second.explanation' },
    ]);
  });
});

describe('validateLessonContent: Check targets', () => {
  it('reports a Predict target created by the Check own Step', () => {
    const content = withSteps([
      {
        ...stepAt(0),
        check: {
          kind: 'predict',
          id: 'find-second',
          correct: { structureId: 'numbers', elementId: 'second' },
        },
      },
      stepAt(1),
      { id: 'find-it', kind: 'explain', events: [] },
      stepAt(3),
    ]);
    expect(validate(content)).toEqual([
      {
        code: 'predict-target-missing',
        step: 'the-problem',
        check: 'find-second',
        target: { structureId: 'numbers', elementId: 'second' },
      },
    ]);
  });

  it('accepts a Predict target that its own Step removes', () => {
    const content = withSteps([
      stepAt(0),
      stepAt(1),
      {
        ...stepAt(2),
        events: [{ type: 'remove-cell', target: { structureId: 'numbers', elementId: 'second' } }],
      },
      {
        ...stepAt(3),
        check: { kind: 'order', id: 'arrange', structureId: 'numbers', correct: ['first'] },
      },
    ]);
    expect(validate(content)).toEqual([]);
  });

  it('reports an Order element missing from its Structure', () => {
    const content = withSteps([
      stepAt(0),
      stepAt(1),
      stepAt(2),
      {
        ...stepAt(3),
        check: {
          kind: 'order',
          id: 'arrange',
          structureId: 'numbers',
          correct: ['first', 'ghost', 'second'],
        },
      },
    ]);
    expect(validate(content)).toEqual([
      {
        code: 'order-element-missing',
        step: 'arrange-it',
        check: 'arrange',
        structure: 'numbers',
        element: 'ghost',
      },
    ]);
  });
});

describe('validateLessonContent: ids in every position', () => {
  const extraStructures: Step['events'] = [
    { type: 'create', structure: { kind: 'stack', id: 'pile', items: [] } },
    { type: 'create', structure: { kind: 'queue', id: 'line', items: [] } },
    { type: 'create', structure: { kind: 'linked-list', id: 'chain', nodes: [], head: null } },
    { type: 'create', structure: { kind: 'hash-map', id: 'table', buckets: [[]] } },
  ];

  const cases: readonly (readonly [string, Step['events'][number], string])[] = [
    [
      'insert-cell',
      { type: 'insert-cell', structureId: 'numbers', index: 0, cell: { id: 'Ins_Cell', value: 0 } },
      'Ins_Cell',
    ],
    [
      'push',
      { type: 'push', structureId: 'pile', cell: { id: 'Push_Cell', value: 0 } },
      'Push_Cell',
    ],
    [
      'enqueue',
      { type: 'enqueue', structureId: 'line', cell: { id: 'Enq_Cell', value: 0 } },
      'Enq_Cell',
    ],
    [
      'add-node',
      { type: 'add-node', structureId: 'chain', node: { id: 'Add_Node', value: 0, next: null } },
      'Add_Node',
    ],
    [
      'put-entry',
      {
        type: 'put-entry',
        structureId: 'table',
        bucket: 0,
        entry: { id: 'Put_Entry', key: 'k', value: 0 },
      },
      'Put_Entry',
    ],
  ];

  it.each(cases)('reports an invalid element id from %s', (_name, event, id) => {
    const content = withSteps([
      { ...stepAt(0), events: [...stepAt(0).events, ...extraStructures, event] },
      stepAt(1),
      stepAt(2),
      stepAt(3),
    ]);
    expect(validate(content)).toEqual([{ code: 'invalid-id', kind: 'element', id }]);
  });

  it('reports an invalid pointer id from a point event', () => {
    const content = withSteps([
      stepAt(0),
      {
        ...stepAt(1),
        events: [{ type: 'point', pointer: { id: 'Bad_Ptr', label: 'p', target: null } }],
      },
      stepAt(2),
      stepAt(3),
    ]);
    expect(validate(content)).toEqual([{ code: 'invalid-id', kind: 'pointer', id: 'Bad_Ptr' }]);
  });

  it('reports invalid ids in the initial Scene', () => {
    const content: LessonContent = {
      ...baseContent,
      lesson: {
        ...baseLesson,
        initialScene: {
          structures: [
            { kind: 'array', id: 'Init_Struct', cells: [{ id: 'Init_Cell', value: 0 }] },
          ],
          pointers: [{ id: 'Init_Ptr', label: 'p', target: null }],
          highlights: [],
        },
      },
    };
    expect(validate(content)).toEqual([
      { code: 'invalid-id', kind: 'structure', id: 'Init_Struct' },
      { code: 'invalid-id', kind: 'element', id: 'Init_Cell' },
      { code: 'invalid-id', kind: 'pointer', id: 'Init_Ptr' },
    ]);
  });
});

describe('validateLessonContent: message keys', () => {
  it('reports a missing title', () => {
    // @ts-expect-error title is deliberately undefined
    const content = withPolish({ title: undefined });
    expect(validate(content)).toEqual([
      { code: 'missing-message-key', locale: 'pl', path: 'title' },
      { code: 'locale-key-mismatch', path: 'title', presentIn: 'en', absentIn: 'pl' },
    ]);
  });

  it('reports a missing Outcome', () => {
    const content = withPolish({ outcomes: {} });
    expect(validate(content)).toEqual([
      { code: 'missing-message-key', locale: 'pl', path: 'outcomes.read-an-array' },
      {
        code: 'locale-key-mismatch',
        path: 'outcomes.read-an-array',
        presentIn: 'en',
        absentIn: 'pl',
      },
    ]);
  });

  it('reports an extra Outcome', () => {
    const content = withPolish({
      outcomes: { ...polishMessages.outcomes, 'ghost-outcome': 'x' },
    });
    expect(validate(content)).toEqual([
      { code: 'extra-message-key', locale: 'pl', path: 'outcomes.ghost-outcome' },
      {
        code: 'locale-key-mismatch',
        path: 'outcomes.ghost-outcome',
        presentIn: 'pl',
        absentIn: 'en',
      },
    ]);
  });

  it('reports a missing Term gloss', () => {
    const content = withPolish({
      terms: {
        // @ts-expect-error the gloss is deliberately absent
        array: { term: 'array' },
      },
    });
    expect(validate(content)).toEqual([
      { code: 'missing-message-key', locale: 'pl', path: 'terms.array.gloss' },
      { code: 'locale-key-mismatch', path: 'terms.array.gloss', presentIn: 'en', absentIn: 'pl' },
    ]);
  });

  it('reports an extra Term', () => {
    const content = withPolish({
      terms: { ...polishMessages.terms, ghost: { term: 'ghost', gloss: 'duch' } },
    });
    expect(validate(content)).toEqual([
      { code: 'extra-message-key', locale: 'pl', path: 'terms.ghost.term' },
      { code: 'extra-message-key', locale: 'pl', path: 'terms.ghost.gloss' },
      { code: 'locale-key-mismatch', path: 'terms.ghost.term', presentIn: 'pl', absentIn: 'en' },
      { code: 'locale-key-mismatch', path: 'terms.ghost.gloss', presentIn: 'pl', absentIn: 'en' },
    ]);
  });

  it('reports an extra top-level key', () => {
    const content = withPolish({
      // @ts-expect-error subtitle is not part of LessonMessages
      subtitle: 'x',
    });
    expect(validate(content)).toEqual([
      { code: 'extra-message-key', locale: 'pl', path: 'subtitle' },
      { code: 'locale-key-mismatch', path: 'subtitle', presentIn: 'pl', absentIn: 'en' },
    ]);
  });

  it('reports an empty object for an unknown Check as an extra key', () => {
    const content = withPolish({
      checks: {
        ...polishMessages.checks,
        // @ts-expect-error an empty Check messages object is deliberately malformed
        'ghost-check': {},
      },
    });
    expect(validate(content)).toEqual([
      { code: 'extra-message-key', locale: 'pl', path: 'checks.ghost-check' },
      { code: 'locale-key-mismatch', path: 'checks.ghost-check', presentIn: 'pl', absentIn: 'en' },
    ]);
  });

  it('reports an undefined leaf as a missing key', () => {
    const content = withPolish({
      steps: {
        ...polishMessages.steps,
        // @ts-expect-error the caption is deliberately undefined
        'find-it': { title: 'Znajdź', caption: undefined },
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

  it('does not double message issues when Step ids repeat', () => {
    const content: LessonContent = {
      ...withPolish({
        steps: {
          ...polishMessages.steps,
          // @ts-expect-error the caption is deliberately absent
          'find-it': { title: 'Znajdź' },
        },
      }),
      lesson: {
        ...baseLesson,
        steps: [...baseLesson.steps, { id: 'find-it', kind: 'explain', events: [] }],
      },
    };
    expect(validate(content)).toEqual([
      { code: 'duplicate-step-id', step: 'find-it' },
      { code: 'missing-message-key', locale: 'pl', path: 'steps.find-it.caption' },
      {
        code: 'locale-key-mismatch',
        path: 'steps.find-it.caption',
        presentIn: 'en',
        absentIn: 'pl',
      },
    ]);
  });
});
