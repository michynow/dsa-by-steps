import type { Cell, ElementRef, Lesson } from '@/domain';

function frame(id: string): ElementRef {
  return { structureId: 'calls', elementId: id };
}

function found(id: string): ElementRef {
  return { structureId: 'found', elementId: id };
}

function cell(id: string, value: string): Cell {
  return { id, value };
}

export const recursionLesson: Lesson = {
  slug: 'recursion',
  outcomes: [
    'name-base-and-recursive-case',
    'trace-the-call-stack',
    'explain-stack-overflow',
    'recurse-over-nested-data',
  ],
  initialScene: { structures: [], pointers: [], highlights: [] },
  steps: [
    {
      id: 'overview',
      kind: 'explain',
      events: [
        {
          type: 'create',
          structure: {
            kind: 'stack',
            id: 'sample-calls',
            items: [
              cell('sample-photos', 'Photos'),
              cell('sample-trip', 'Trip'),
              cell('sample-day-two', 'Day two'),
            ],
          },
        },
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'sample-found',
            cells: [cell('sample-logo', 'logo.png'), cell('sample-beach', 'beach.jpg')],
          },
        },
      ],
    },
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        { type: 'remove', structureId: 'sample-calls' },
        { type: 'remove', structureId: 'sample-found' },
        { type: 'create', structure: { kind: 'stack', id: 'calls', items: [] } },
        { type: 'create', structure: { kind: 'array', id: 'found', cells: [] } },
      ],
    },
    {
      id: 'first-call',
      kind: 'explain',
      events: [
        { type: 'push', structureId: 'calls', cell: cell('photos', 'Photos') },
        { type: 'highlight', highlight: { target: frame('photos'), tone: 'focus' } },
      ],
    },
    {
      id: 'a-file-is-the-base-case',
      kind: 'explain',
      events: [
        { type: 'insert-cell', structureId: 'found', index: 0, cell: cell('logo', 'logo.png') },
        { type: 'highlight', highlight: { target: found('logo'), tone: 'done' } },
      ],
      check: {
        kind: 'choice',
        id: 'what-to-do-with-a-file',
        options: ['add-and-return', 'open-it', 'skip-it', 'add-and-descend'],
        correct: 'add-and-return',
      },
    },
    {
      id: 'a-folder-is-the-recursive-case',
      kind: 'explain',
      events: [{ type: 'push', structureId: 'calls', cell: cell('trip', 'Trip') }],
      check: {
        kind: 'choice',
        id: 'what-to-do-with-a-folder',
        options: ['call-itself', 'list-the-folder', 'skip-the-folder', 'stop-here'],
        correct: 'call-itself',
      },
    },
    {
      id: 'going-deeper',
      kind: 'explain',
      events: [
        { type: 'insert-cell', structureId: 'found', index: 1, cell: cell('beach', 'beach.jpg') },
        { type: 'push', structureId: 'calls', cell: cell('day-two', 'Day two') },
      ],
      check: {
        kind: 'choice',
        id: 'frames-when-entering-day-two',
        options: ['three-frames', 'two-frames', 'five-frames', 'one-frame'],
        correct: 'three-frames',
      },
    },
    {
      id: 'only-the-top-runs',
      kind: 'explain',
      events: [
        { type: 'insert-cell', structureId: 'found', index: 2, cell: cell('hike', 'hike.jpg') },
      ],
      check: { kind: 'predict', id: 'which-call-is-running', correct: frame('day-two') },
    },
    {
      id: 'a-call-returns',
      kind: 'explain',
      events: [{ type: 'pop', structureId: 'calls' }],
      check: { kind: 'predict', id: 'which-call-continues', correct: frame('trip') },
    },
    {
      id: 'back-in-photos',
      kind: 'explain',
      events: [{ type: 'pop', structureId: 'calls' }],
    },
    {
      id: 'the-last-entry',
      kind: 'explain',
      events: [
        { type: 'insert-cell', structureId: 'found', index: 3, cell: cell('notes', 'notes.txt') },
        { type: 'pop', structureId: 'calls' },
      ],
      check: {
        kind: 'choice',
        id: 'state-after-the-first-call-returns',
        options: ['empty-stack-four-files', 'photos-stays', 'only-direct-files', 'frames-stay'],
        correct: 'empty-stack-four-files',
      },
    },
    {
      id: 'no-base-case',
      kind: 'explain',
      events: [
        { type: 'push', structureId: 'calls', cell: cell('loop-photos-1', 'Photos') },
        { type: 'push', structureId: 'calls', cell: cell('loop-shortcut-1', 'Shortcut') },
        { type: 'push', structureId: 'calls', cell: cell('loop-photos-2', 'Photos') },
        { type: 'push', structureId: 'calls', cell: cell('loop-shortcut-2', 'Shortcut') },
        { type: 'push', structureId: 'calls', cell: cell('loop-photos-3', 'Photos') },
        { type: 'highlight', highlight: { target: frame('loop-photos-3'), tone: 'error' } },
      ],
      check: {
        kind: 'choice',
        id: 'folder-that-contains-itself',
        options: ['stack-overflow', 'runtime-notices', 'lists-twice', 'small-stack'],
        correct: 'stack-overflow',
      },
    },
    {
      id: 'total-size-preview',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'calls' },
        { type: 'remove', structureId: 'found' },
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'sizes',
            cells: [
              cell('logo-size', '12'),
              cell('beach-size', '40'),
              cell('hike-size', '35'),
              cell('notes-size', '3'),
            ],
          },
        },
      ],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [{ type: 'remove', structureId: 'sizes' }],
    },
  ],
};
