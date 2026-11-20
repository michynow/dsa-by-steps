import type { ElementRef, Lesson } from '@/domain';

function clue(id: string): ElementRef {
  return { structureId: 'trail', elementId: id };
}

function slot(id: string): ElementRef {
  return { structureId: 'sheet', elementId: id };
}

export const linkedListsLesson: Lesson = {
  slug: 'linked-lists',
  outcomes: [
    'explain-nodes-and-links',
    'traverse-from-head',
    'insert-in-constant-time',
    'delete-by-relinking',
    'compare-with-arrays',
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
            kind: 'linked-list',
            id: 'trail',
            nodes: [
              { id: 'mat', value: 'Mat', next: 'mail' },
              { id: 'mail', value: 'Mail', next: 'shed' },
              { id: 'shed', value: 'Shed', next: null },
            ],
            head: 'mat',
          },
        },
      ],
    },
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        { type: 'remove', structureId: 'trail' },
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'sheet',
            cells: [
              { id: 'slot-mat', value: 'Mat' },
              { id: 'slot-mail', value: 'Mail' },
              { id: 'slot-oven', value: 'Oven' },
              { id: 'slot-shed', value: 'Shed' },
            ],
          },
        },
        {
          type: 'insert-cell',
          structureId: 'sheet',
          index: 2,
          cell: { id: 'slot-clock', value: 'Clock' },
        },
        { type: 'highlight', highlight: { target: slot('slot-clock'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: slot('slot-oven'), tone: 'error' } },
        { type: 'highlight', highlight: { target: slot('slot-shed'), tone: 'error' } },
      ],
    },
    {
      id: 'a-clue',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'sheet' },
        { type: 'clear-highlights' },
        {
          type: 'create',
          structure: {
            kind: 'linked-list',
            id: 'trail',
            nodes: [{ id: 'mat', value: 'Mat', next: null }],
            head: null,
          },
        },
      ],
    },
    {
      id: 'chaining-clues',
      kind: 'explain',
      events: [
        { type: 'add-node', structureId: 'trail', node: { id: 'mail', value: 'Mail', next: null } },
        { type: 'add-node', structureId: 'trail', node: { id: 'oven', value: 'Oven', next: null } },
        { type: 'add-node', structureId: 'trail', node: { id: 'shed', value: 'Shed', next: null } },
        { type: 'link', structureId: 'trail', from: 'mat', to: 'mail' },
        { type: 'link', structureId: 'trail', from: 'mail', to: 'oven' },
        { type: 'link', structureId: 'trail', from: 'oven', to: 'shed' },
      ],
      check: {
        kind: 'choice',
        id: 'what-a-clue-holds',
        options: ['next-link', 'copy-of-next', 'position-number', 'nothing-extra'],
        correct: 'next-link',
      },
    },
    {
      id: 'the-first-clue',
      kind: 'explain',
      events: [
        { type: 'set-head', structureId: 'trail', head: 'mat' },
        { type: 'highlight', highlight: { target: clue('mat'), tone: 'focus' } },
      ],
      check: { kind: 'predict', id: 'which-clue-is-first', correct: clue('mat') },
    },
    {
      id: 'finger-on-a-clue',
      kind: 'explain',
      events: [{ type: 'point', pointer: { id: 'here', label: 'here', target: clue('mat') } }],
    },
    {
      id: 'following-the-trail',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'here', target: clue('mail') },
        { type: 'move-pointer', pointerId: 'here', target: clue('oven') },
        { type: 'move-pointer', pointerId: 'here', target: clue('shed') },
      ],
      check: { kind: 'predict', id: 'where-the-walk-lands', correct: clue('oven') },
    },
    {
      id: 'add-a-stop',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'here', target: clue('mail') },
        {
          type: 'add-node',
          structureId: 'trail',
          node: { id: 'clock', value: 'Clock', next: null },
        },
        { type: 'highlight', highlight: { target: clue('clock'), tone: 'focus' } },
        { type: 'link', structureId: 'trail', from: 'clock', to: 'oven' },
        { type: 'link', structureId: 'trail', from: 'mail', to: 'clock' },
      ],
      check: {
        kind: 'choice',
        id: 'first-rewrite-for-new-stop',
        options: ['new-to-next', 'previous-to-new', 'new-to-previous', 'either-order'],
        correct: 'new-to-next',
      },
    },
    {
      id: 'remove-a-stop',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'prev', label: 'prev', target: clue('clock') } },
        { type: 'highlight', highlight: { target: clue('oven'), tone: 'error' } },
        { type: 'link', structureId: 'trail', from: 'clock', to: 'shed' },
        { type: 'remove-node', target: clue('oven') },
        { type: 'drop-pointer', pointerId: 'prev' },
      ],
      check: { kind: 'predict', id: 'clue-before-the-removed', correct: clue('clock') },
    },
    {
      id: 'jump-to-a-clue',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'here', target: clue('mat') },
        { type: 'move-pointer', pointerId: 'here', target: clue('mail') },
        { type: 'move-pointer', pointerId: 'here', target: clue('clock') },
        { type: 'move-pointer', pointerId: 'here', target: clue('shed') },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-reaching-clue-k',
        options: ['k-moves', 'one-move', 'whole-trail', 'halving'],
        correct: 'k-moves',
      },
    },
    {
      id: 'sheet-vs-trail',
      kind: 'explain',
      events: [
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'sheet',
            cells: [
              { id: 'slot-mat', value: 'Mat' },
              { id: 'slot-mail', value: 'Mail' },
              { id: 'slot-clock', value: 'Clock' },
              { id: 'slot-shed', value: 'Shed' },
            ],
          },
        },
        { type: 'highlight', highlight: { target: slot('slot-shed'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: clue('shed'), tone: 'compare' } },
      ],
      check: {
        kind: 'choice',
        id: 'cheaper-on-a-trail',
        options: ['insert-after-current', 'read-by-index', 'read-every-clue'],
        correct: 'insert-after-current',
      },
    },
    {
      id: 'reverse-preview',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'sheet' },
        { type: 'clear-highlights' },
        { type: 'drop-pointer', pointerId: 'here' },
        { type: 'point', pointer: { id: 'prev', label: 'prev', target: null } },
        { type: 'point', pointer: { id: 'current', label: 'current', target: clue('mat') } },
        { type: 'point', pointer: { id: 'next', label: 'next', target: clue('mail') } },
        { type: 'highlight', highlight: { target: clue('mat'), tone: 'focus' } },
      ],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'prev' },
        { type: 'drop-pointer', pointerId: 'current' },
        { type: 'drop-pointer', pointerId: 'next' },
      ],
    },
  ],
};
