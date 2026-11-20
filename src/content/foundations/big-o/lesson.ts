import type { Cell, ElementRef, Lesson } from '@/domain';

function product(id: string): ElementRef {
  return { structureId: 'products', elementId: id };
}

function listing(id: string): ElementRef {
  return { structureId: 'listings', elementId: id };
}

function cell(id: string, value: string | number): Cell {
  return { id, value };
}

export const bigOLesson: Lesson = {
  slug: 'big-o',
  outcomes: [
    'read-in-constant-time',
    'scan-in-linear-time',
    'predict-growth',
    'count-pairs-quadratically',
    'drop-constant-factors',
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
            id: 'products',
            cells: [
              cell('prod-mug', 'mug'),
              cell('prod-lamp', 'lamp'),
              cell('prod-pen', 'pen'),
              cell('prod-tape', 'tape'),
              cell('prod-book', 'book'),
              cell('prod-mat', 'mat'),
            ],
          },
        },
      ],
    },
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        {
          type: 'point',
          pointer: { id: 'cursor', label: 'cursor', target: product('prod-mug') },
        },
      ],
    },
    {
      id: 'counting-steps',
      kind: 'explain',
      events: [{ type: 'highlight', highlight: { target: product('prod-mug'), tone: 'focus' } }],
    },
    {
      id: 'constant-lookup',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'cursor', target: product('prod-book') },
        { type: 'highlight', highlight: { target: product('prod-book'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-reading-by-position',
        options: ['one-step', 'walk-from-start', 'walk-from-nearer-end'],
        correct: 'one-step',
      },
    },
    {
      id: 'linear-scan',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'cursor', target: product('prod-tape') },
        { type: 'highlight', highlight: { target: product('prod-mug'), tone: 'done' } },
        { type: 'highlight', highlight: { target: product('prod-lamp'), tone: 'done' } },
        { type: 'highlight', highlight: { target: product('prod-pen'), tone: 'done' } },
        { type: 'highlight', highlight: { target: product('prod-tape'), tone: 'focus' } },
      ],
      check: { kind: 'predict', id: 'last-product-read', correct: product('prod-tape') },
    },
    {
      id: 'missing-product',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'cursor', target: product('prod-mat') },
        { type: 'highlight', highlight: { target: product('prod-mug'), tone: 'done' } },
        { type: 'highlight', highlight: { target: product('prod-lamp'), tone: 'done' } },
        { type: 'highlight', highlight: { target: product('prod-pen'), tone: 'done' } },
        { type: 'highlight', highlight: { target: product('prod-tape'), tone: 'done' } },
        { type: 'highlight', highlight: { target: product('prod-book'), tone: 'done' } },
        { type: 'highlight', highlight: { target: product('prod-mat'), tone: 'done' } },
      ],
      check: {
        kind: 'choice',
        id: 'steps-for-missing-product',
        options: ['every-product', 'half-the-products', 'single-step'],
        correct: 'every-product',
      },
    },
    {
      id: 'growth-with-size',
      kind: 'explain',
      events: [{ type: 'drop-pointer', pointerId: 'cursor' }],
      check: {
        kind: 'choice',
        id: 'steps-when-shop-doubles',
        options: ['doubles', 'unchanged', 'grows-slightly'],
        correct: 'doubles',
      },
    },
    {
      id: 'duplicate-listings',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'products' },
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'listings',
            cells: [
              cell('list-mug-first', 'mug'),
              cell('list-pen', 'pen'),
              cell('list-mug-again', 'mug'),
              cell('list-lamp', 'lamp'),
              cell('list-tape', 'tape'),
            ],
          },
        },
        { type: 'highlight', highlight: { target: listing('list-mug-first'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: listing('list-pen'), tone: 'focus' } },
      ],
    },
    {
      id: 'count-pairs',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: listing('list-mug-first'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: listing('list-mug-again'), tone: 'done' } },
      ],
      check: {
        kind: 'choice',
        id: 'comparisons-for-five-listings',
        options: ['ten', 'five', 'twenty-five'],
        correct: 'ten',
      },
    },
    {
      id: 'quadratic-growth',
      kind: 'explain',
      events: [{ type: 'highlight', highlight: { target: listing('list-tape'), tone: 'focus' } }],
      check: {
        kind: 'choice',
        id: 'comparisons-when-listings-double',
        options: ['four-times', 'twice', 'one-per-new-listing'],
        correct: 'four-times',
      },
    },
    {
      id: 'ignore-constants',
      kind: 'explain',
      events: [{ type: 'highlight', highlight: { target: listing('list-lamp'), tone: 'focus' } }],
      check: {
        kind: 'choice',
        id: 'cost-of-three-passes',
        options: ['linear', 'exact-count', 'cubic'],
        correct: 'linear',
      },
    },
    {
      id: 'pairs-preview',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'listings' },
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'prices',
            cells: [
              cell('price-first-three', 3),
              cell('price-seven', 7),
              cell('price-second-three', 3),
              cell('price-five', 5),
            ],
          },
        },
      ],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [{ type: 'remove', structureId: 'prices' }],
    },
  ],
};
