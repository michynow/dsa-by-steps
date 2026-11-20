import type { Cell, ElementRef, Lesson } from '@/domain';

function day(id: string): ElementRef {
  return { structureId: 'sales', elementId: id };
}

function total(id: string): ElementRef {
  return { structureId: 'totals', elementId: id };
}

function cell(id: string, value: number): Cell {
  return { id, value };
}

const salesPerDay: readonly Cell[] = [
  cell('d0', 4),
  cell('d1', 2),
  cell('d2', 5),
  cell('d3', 3),
  cell('d4', 6),
  cell('d5', 1),
  cell('d6', 4),
];

const runningTotals: readonly Cell[] = [
  cell('t0', 0),
  cell('t1', 4),
  cell('t2', 6),
  cell('t3', 11),
  cell('t4', 14),
  cell('t5', 20),
  cell('t6', 21),
  cell('t7', 25),
];

export const prefixSumsLesson: Lesson = {
  slug: 'prefix-sums',
  outcomes: [
    'see-the-repeated-work',
    'build-the-running-totals',
    'subtract-two-totals',
    'state-the-cost',
  ],
  initialScene: { structures: [], pointers: [], highlights: [] },
  steps: [
    {
      id: 'overview',
      kind: 'explain',
      events: [
        { type: 'create', structure: { kind: 'array', id: 'sales', cells: salesPerDay } },
        { type: 'create', structure: { kind: 'array', id: 'totals', cells: runningTotals } },
        { type: 'point', pointer: { id: 'before', label: 'before', target: total('t2') } },
        { type: 'point', pointer: { id: 'through', label: 'through', target: total('t6') } },
        { type: 'highlight', highlight: { target: day('d2'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d3'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d4'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d5'), tone: 'done' } },
      ],
    },
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        { type: 'drop-pointer', pointerId: 'before' },
        { type: 'drop-pointer', pointerId: 'through' },
        { type: 'remove', structureId: 'totals' },
      ],
    },
    {
      id: 'adding-again',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: day('d2'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: day('d3'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: day('d4'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: day('d5'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-adding-again',
        options: [
          'every-query-adds-again',
          'each-day-once',
          'one-step-per-query',
          'overlap-is-shared',
        ],
        correct: 'every-query-adds-again',
      },
    },
    {
      id: 'the-leading-zero',
      kind: 'explain',
      events: [
        {
          type: 'create',
          structure: { kind: 'array', id: 'totals', cells: [cell('t0', 0)] },
        },
        { type: 'highlight', highlight: { target: total('t0'), tone: 'done' } },
      ],
      check: {
        kind: 'choice',
        id: 'how-many-totals',
        options: ['one-per-day', 'one-more-than-days', 'one-fewer-than-days', 'two-per-day'],
        correct: 'one-more-than-days',
      },
    },
    {
      id: 'the-first-totals',
      kind: 'explain',
      events: [
        { type: 'insert-cell', structureId: 'totals', index: 1, cell: cell('t1', 4) },
        { type: 'insert-cell', structureId: 'totals', index: 2, cell: cell('t2', 6) },
        { type: 'highlight', highlight: { target: day('d0'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d1'), tone: 'done' } },
      ],
    },
    {
      id: 'the-next-total',
      kind: 'explain',
      events: [
        { type: 'insert-cell', structureId: 'totals', index: 3, cell: cell('t3', 11) },
        { type: 'highlight', highlight: { target: day('d2'), tone: 'focus' } },
      ],
      check: { kind: 'predict', id: 'which-day-is-added', correct: day('d2') },
    },
    {
      id: 'fill-the-totals',
      kind: 'explain',
      events: [
        { type: 'insert-cell', structureId: 'totals', index: 4, cell: cell('t4', 14) },
        { type: 'insert-cell', structureId: 'totals', index: 5, cell: cell('t5', 20) },
        { type: 'insert-cell', structureId: 'totals', index: 6, cell: cell('t6', 21) },
        { type: 'insert-cell', structureId: 'totals', index: 7, cell: cell('t7', 25) },
        { type: 'highlight', highlight: { target: total('t7'), tone: 'done' } },
      ],
      check: {
        kind: 'choice',
        id: 'additions-to-build',
        options: ['all-days-each-time', 'one-per-day', 'two-per-day', 'just-the-last'],
        correct: 'one-per-day',
      },
    },
    {
      id: 'subtract-two-totals',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'before', label: 'before', target: total('t2') } },
        { type: 'point', pointer: { id: 'through', label: 'through', target: total('t6') } },
        { type: 'highlight', highlight: { target: day('d2'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d3'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d4'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d5'), tone: 'done' } },
      ],
      check: { kind: 'predict', id: 'which-total-ends-the-range', correct: total('t6') },
    },
    {
      id: 'from-the-first-day',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'before', target: total('t0') },
        { type: 'move-pointer', pointerId: 'through', target: total('t4') },
        { type: 'highlight', highlight: { target: day('d0'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d1'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d2'), tone: 'done' } },
        { type: 'highlight', highlight: { target: day('d3'), tone: 'done' } },
      ],
      check: {
        kind: 'choice',
        id: 'range-from-the-first-day',
        options: [
          'end-at-the-last-day',
          'leading-zero-is-the-start',
          'skip-the-first-total',
          'no-total-before',
        ],
        correct: 'leading-zero-is-the-start',
      },
    },
    {
      id: 'cost-per-query',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: total('t0'), tone: 'compare' } },
        { type: 'highlight', highlight: { target: total('t4'), tone: 'compare' } },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-a-query',
        options: [
          'grows-with-the-range',
          'same-for-every-query',
          'grows-with-the-year',
          'log-of-days',
        ],
        correct: 'same-for-every-query',
      },
    },
    {
      id: 'answer-many-ranges',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'before' },
        { type: 'drop-pointer', pointerId: 'through' },
      ],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [{ type: 'highlight', highlight: { target: total('t7'), tone: 'done' } }],
    },
  ],
};
