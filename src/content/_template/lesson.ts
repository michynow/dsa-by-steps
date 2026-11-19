import type { Lesson } from '@/domain';

export const templateLesson: Lesson = {
  slug: 'template-lesson',
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
              { id: 'first', value: 4 },
              { id: 'second', value: 7 },
              { id: 'third', value: 9 },
            ],
          },
        },
      ],
    },
    {
      id: 'how-it-works',
      kind: 'explain',
      events: [
        {
          type: 'highlight',
          highlight: { target: { structureId: 'numbers', elementId: 'second' }, tone: 'focus' },
        },
      ],
      check: {
        kind: 'choice',
        id: 'which-index',
        options: ['index-one', 'index-two'],
        correct: 'index-one',
      },
    },
  ],
};
