import type { Cell, ElementRef, Lesson } from '@/domain';

function edit(id: string): ElementRef {
  return { structureId: 'undo', elementId: id };
}

function job(id: string): ElementRef {
  return { structureId: 'print', elementId: id };
}

function cell(id: string, value: string): Cell {
  return { id, value };
}

export const stacksAndQueuesLesson: Lesson = {
  slug: 'stacks-and-queues',
  outcomes: [
    'push-and-pop-at-the-top',
    'constant-time-operations',
    'enqueue-and-dequeue-in-order',
    'choose-stack-or-queue',
    'match-brackets-with-a-stack',
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
            id: 'sample-stack',
            items: [
              cell('sample-type', 'Type'),
              cell('sample-bold', 'Bold'),
              cell('sample-paste', 'Paste'),
            ],
          },
        },
        {
          type: 'create',
          structure: {
            kind: 'queue',
            id: 'sample-queue',
            items: [
              cell('sample-report', 'Report'),
              cell('sample-invoice', 'Invoice'),
              cell('sample-ticket', 'Ticket'),
            ],
          },
        },
      ],
    },
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        { type: 'remove', structureId: 'sample-stack' },
        { type: 'remove', structureId: 'sample-queue' },
        {
          type: 'create',
          structure: {
            kind: 'stack',
            id: 'undo',
            items: [],
          },
        },
      ],
    },
    {
      id: 'push-edits',
      kind: 'explain',
      events: [
        { type: 'push', structureId: 'undo', cell: cell('type', 'Type') },
        { type: 'push', structureId: 'undo', cell: cell('bold', 'Bold') },
        { type: 'push', structureId: 'undo', cell: cell('paste', 'Paste') },
      ],
    },
    {
      id: 'undo-pops',
      kind: 'explain',
      events: [{ type: 'pop', structureId: 'undo' }],
      check: { kind: 'predict', id: 'which-edit-is-undone', correct: edit('paste') },
    },
    {
      id: 'new-edit-after-undo',
      kind: 'explain',
      events: [
        { type: 'push', structureId: 'undo', cell: cell('delete', 'Delete') },
        { type: 'pop', structureId: 'undo' },
      ],
      check: {
        kind: 'choice',
        id: 'undo-after-a-new-edit',
        options: ['delete-on-top', 'paste-comes-back', 'bold-under-new', 'oldest-first'],
        correct: 'delete-on-top',
      },
    },
    {
      id: 'constant-time',
      kind: 'explain',
      events: [
        { type: 'push', structureId: 'undo', cell: cell('italic', 'Italic') },
        { type: 'highlight', highlight: { target: edit('italic'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-push-on-a-long-history',
        options: ['same-small-work', 'shift-all', 'walk-to-spot', 'halving'],
        correct: 'same-small-work',
      },
    },
    {
      id: 'a-queue',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'undo' },
        { type: 'clear-highlights' },
        { type: 'create', structure: { kind: 'queue', id: 'print', items: [] } },
      ],
    },
    {
      id: 'enqueue-jobs',
      kind: 'explain',
      events: [
        { type: 'enqueue', structureId: 'print', cell: cell('report', 'Report') },
        { type: 'enqueue', structureId: 'print', cell: cell('invoice', 'Invoice') },
        { type: 'enqueue', structureId: 'print', cell: cell('ticket', 'Ticket') },
      ],
    },
    {
      id: 'dequeue-print',
      kind: 'explain',
      events: [{ type: 'dequeue', structureId: 'print' }],
      check: { kind: 'predict', id: 'which-job-prints-first', correct: job('report') },
    },
    {
      id: 'late-job',
      kind: 'explain',
      events: [
        { type: 'enqueue', structureId: 'print', cell: cell('poster', 'Poster') },
        { type: 'dequeue', structureId: 'print' },
        { type: 'dequeue', structureId: 'print' },
      ],
      check: {
        kind: 'choice',
        id: 'print-order-with-a-late-job',
        options: ['back-of-queue', 'front-of-queue', 'newest-first', 'short-jobs-first'],
        correct: 'back-of-queue',
      },
    },
    {
      id: 'stack-vs-queue',
      kind: 'explain',
      events: [
        { type: 'enqueue', structureId: 'print', cell: cell('menu', 'Menu') },
        { type: 'enqueue', structureId: 'print', cell: cell('flyer', 'Flyer') },
        {
          type: 'create',
          structure: {
            kind: 'stack',
            id: 'undo',
            items: [cell('type', 'Type'), cell('bold', 'Bold'), cell('paste', 'Paste')],
          },
        },
        { type: 'highlight', highlight: { target: edit('paste'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: job('poster'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'structure-for-redo',
        options: ['stack-for-redo', 'queue-for-redo', 'either-for-redo'],
        correct: 'stack-for-redo',
      },
    },
    {
      id: 'bracket-preview',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'print' },
        { type: 'remove', structureId: 'undo' },
        { type: 'clear-highlights' },
        { type: 'create', structure: { kind: 'stack', id: 'pending', items: [] } },
        { type: 'push', structureId: 'pending', cell: cell('paren', '(') },
        { type: 'push', structureId: 'pending', cell: cell('square', '[') },
      ],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [{ type: 'clear-highlights' }],
    },
  ],
};
