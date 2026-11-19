import type { ElementRef, Lesson } from '@/domain';

function account(id: string): ElementRef {
  return { structureId: 'accounts', elementId: id };
}

function signup(id: string): ElementRef {
  return { structureId: 'signups', elementId: id };
}

export const hashMapsLesson: Lesson = {
  slug: 'hash-maps',
  outcomes: [
    'explain-scan-cost',
    'place-by-hash-function',
    'resolve-collisions',
    'look-up-by-key',
    'know-average-cost',
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
            kind: 'hash-map',
            id: 'accounts',
            buckets: [
              [],
              [
                { id: 'linus', key: 'linus', value: 2 },
                { id: 'grace', key: 'grace', value: 3 },
              ],
              [],
              [{ id: 'ada', key: 'ada', value: 1 }],
            ],
          },
        },
      ],
    },
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        { type: 'remove', structureId: 'accounts' },
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'signups',
            cells: [
              { id: 'slot-ada', value: 'ada' },
              { id: 'slot-linus', value: 'linus' },
              { id: 'slot-grace', value: 'grace' },
            ],
          },
        },
        { type: 'highlight', highlight: { target: signup('slot-ada'), tone: 'compare' } },
        { type: 'highlight', highlight: { target: signup('slot-linus'), tone: 'compare' } },
        { type: 'highlight', highlight: { target: signup('slot-grace'), tone: 'compare' } },
      ],
    },
    {
      id: 'buckets',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'signups' },
        { type: 'clear-highlights' },
        {
          type: 'create',
          structure: { kind: 'hash-map', id: 'accounts', buckets: [[], [], [], []] },
        },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-scanning',
        options: ['every-name', 'half-the-names', 'halving'],
        correct: 'every-name',
      },
    },
    {
      id: 'hash-function',
      kind: 'explain',
      events: [
        {
          type: 'put-entry',
          structureId: 'accounts',
          bucket: 3,
          entry: { id: 'ada', key: 'ada', value: 1 },
        },
        { type: 'highlight', highlight: { target: account('ada'), tone: 'focus' } },
      ],
    },
    {
      id: 'second-account',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        {
          type: 'put-entry',
          structureId: 'accounts',
          bucket: 1,
          entry: { id: 'linus', key: 'linus', value: 2 },
        },
        { type: 'highlight', highlight: { target: account('linus'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'bucket-for-linus',
        options: ['remainder', 'first-empty', 'beside-ada'],
        correct: 'remainder',
      },
    },
    {
      id: 'collision',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        {
          type: 'put-entry',
          structureId: 'accounts',
          bucket: 1,
          entry: { id: 'grace', key: 'grace', value: 3 },
        },
        { type: 'highlight', highlight: { target: account('grace'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: account('linus'), tone: 'compare' } },
      ],
      check: { kind: 'predict', id: 'who-shares-a-bucket', correct: account('linus') },
    },
    {
      id: 'lookup',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'highlight', highlight: { target: account('linus'), tone: 'compare' } },
        { type: 'highlight', highlight: { target: account('grace'), tone: 'done' } },
      ],
      check: { kind: 'predict', id: 'first-compared-in-bucket', correct: account('linus') },
    },
    {
      id: 'free-name',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'highlight', highlight: { target: account('ada'), tone: 'compare' } },
        {
          type: 'put-entry',
          structureId: 'accounts',
          bucket: 3,
          entry: { id: 'tim', key: 'tim', value: 4 },
        },
        { type: 'highlight', highlight: { target: account('tim'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'is-tim-taken',
        options: ['compare-keys', 'bucket-occupied', 'same-hash', 'scan-everything'],
        correct: 'compare-keys',
      },
    },
    {
      id: 'duplicate-signup',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'highlight', highlight: { target: account('ada'), tone: 'error' } },
      ],
    },
    {
      id: 'average-cost',
      kind: 'explain',
      events: [{ type: 'clear-highlights' }],
      check: {
        kind: 'choice',
        id: 'cost-of-lookup',
        options: ['a-few', 'every-account', 'halving', 'exactly-one'],
        correct: 'a-few',
      },
    },
    {
      id: 'duplicate-preview',
      kind: 'explain',
      events: [
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'signups',
            cells: [
              { id: 'slot-ada', value: 'ada' },
              { id: 'slot-linus', value: 'linus' },
              { id: 'slot-grace', value: 'grace' },
              { id: 'slot-linus-again', value: 'linus' },
              { id: 'slot-ada-again', value: 'ada' },
            ],
          },
        },
        {
          type: 'point',
          pointer: { id: 'cursor', label: 'cursor', target: signup('slot-ada') },
        },
      ],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'cursor' },
        { type: 'remove', structureId: 'signups' },
      ],
    },
  ],
};
