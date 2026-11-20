import type { Cell, ElementRef, Lesson } from '@/domain';

function price(id: string): ElementRef {
  return { structureId: 'prices', elementId: id };
}

function cell(id: string, value: number): Cell {
  return { id, value };
}

export const arraysAndTwoPointersLesson: Lesson = {
  slug: 'arrays-and-two-pointers',
  outcomes: [
    'read-by-index',
    'move-by-the-sum',
    'discard-with-sorted-order',
    'find-the-pair',
    'count-the-moves',
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
            kind: 'array',
            id: 'prices',
            cells: [
              cell('pen', 4),
              cell('mug', 7),
              cell('book', 12),
              cell('lamp', 19),
              cell('tote', 25),
              cell('jacket', 30),
            ],
          },
        },
        { type: 'point', pointer: { id: 'left', label: 'left', target: price('book') } },
        { type: 'point', pointer: { id: 'right', label: 'right', target: price('lamp') } },
        { type: 'highlight', highlight: { target: price('book'), tone: 'done' } },
        { type: 'highlight', highlight: { target: price('lamp'), tone: 'done' } },
      ],
    },
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        { type: 'drop-pointer', pointerId: 'left' },
        { type: 'drop-pointer', pointerId: 'right' },
      ],
    },
    {
      id: 'read-by-index',
      kind: 'explain',
      events: [{ type: 'highlight', highlight: { target: price('lamp'), tone: 'focus' } }],
      check: { kind: 'predict', id: 'price-at-index-three', correct: price('lamp') },
    },
    {
      id: 'one-pointer-at-each-end',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'left', label: 'left', target: price('pen') } },
        { type: 'point', pointer: { id: 'right', label: 'right', target: price('jacket') } },
      ],
    },
    {
      id: 'add-the-two-prices',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: price('pen'), tone: 'compare' } },
        { type: 'highlight', highlight: { target: price('jacket'), tone: 'compare' } },
      ],
    },
    {
      id: 'too-big',
      kind: 'explain',
      events: [{ type: 'move-pointer', pointerId: 'right', target: price('tote') }],
      check: {
        kind: 'choice',
        id: 'which-pointer-moves',
        options: ['right-moves-left', 'left-moves-right', 'both-move-in', 'restart-from-next'],
        correct: 'right-moves-left',
      },
    },
    {
      id: 'too-small',
      kind: 'explain',
      events: [{ type: 'move-pointer', pointerId: 'left', target: price('mug') }],
      check: { kind: 'predict', id: 'where-left-lands', correct: price('mug') },
    },
    {
      id: 'a-price-stays-out',
      kind: 'explain',
      events: [{ type: 'move-pointer', pointerId: 'right', target: price('lamp') }],
      check: {
        kind: 'choice',
        id: 'could-the-leftover-return',
        options: ['left-only-grows', 'must-retry', 'pointer-may-return', 'failed-once'],
        correct: 'left-only-grows',
      },
    },
    {
      id: 'the-match',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'left', target: price('book') },
        { type: 'highlight', highlight: { target: price('book'), tone: 'done' } },
        { type: 'highlight', highlight: { target: price('lamp'), tone: 'done' } },
      ],
      check: { kind: 'predict', id: 'price-that-completes-the-pair', correct: price('book') },
    },
    {
      id: 'count-the-moves',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: price('pen'), tone: 'error' } },
        { type: 'highlight', highlight: { target: price('mug'), tone: 'error' } },
        { type: 'highlight', highlight: { target: price('tote'), tone: 'error' } },
        { type: 'highlight', highlight: { target: price('jacket'), tone: 'error' } },
      ],
      check: {
        kind: 'choice',
        id: 'moves-on-a-long-list',
        options: ['one-per-price', 'every-pair', 'halving'],
        correct: 'one-per-price',
      },
    },
    {
      id: 'return-the-positions',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: price('book'), tone: 'done' } },
        { type: 'highlight', highlight: { target: price('lamp'), tone: 'done' } },
      ],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'left' },
        { type: 'drop-pointer', pointerId: 'right' },
      ],
    },
  ],
};
