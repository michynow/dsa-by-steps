import type { Cell, ElementRef, Lesson, StepEvent } from '@/domain';

const minutes: readonly Cell[] = [
  { id: 'm1', value: 2 },
  { id: 'm2', value: 5 },
  { id: 'm3', value: 1 },
  { id: 'm4', value: 4 },
  { id: 'm5', value: 3 },
  { id: 'm6', value: 6 },
  { id: 'm7', value: 2 },
  { id: 'm8', value: 1 },
];

function minute(id: string): ElementRef {
  return { structureId: 'log', elementId: id };
}

function mark(from: number, to: number, tone: 'focus' | 'done'): readonly StepEvent[] {
  return minutes.slice(from - 1, to).map((cell): StepEvent => ({
    type: 'highlight',
    highlight: { target: minute(cell.id), tone },
  }));
}

export const slidingWindowLesson: Lesson = {
  slug: 'sliding-window',
  outcomes: [
    'size-the-window',
    'update-the-total',
    'find-the-busiest-window',
    'grow-and-shrink',
    'count-the-cost',
  ],
  initialScene: { structures: [], pointers: [], highlights: [] },
  steps: [
    {
      id: 'overview',
      kind: 'explain',
      events: [
        { type: 'create', structure: { kind: 'array', id: 'log', cells: minutes } },
        { type: 'point', pointer: { id: 'left', label: 'left', target: minute('m2') } },
        { type: 'point', pointer: { id: 'right', label: 'right', target: minute('m6') } },
        ...mark(2, 6, 'done'),
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
      id: 'first-window',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'left', label: 'left', target: minute('m1') } },
        { type: 'point', pointer: { id: 'right', label: 'right', target: minute('m5') } },
        ...mark(1, 5, 'focus'),
      ],
      check: { kind: 'predict', id: 'where-the-window-ends', correct: minute('m5') },
    },
    {
      id: 'slide-one-minute',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'left', target: minute('m2') },
        { type: 'move-pointer', pointerId: 'right', target: minute('m6') },
        ...mark(2, 6, 'focus'),
      ],
      check: {
        kind: 'choice',
        id: 'total-after-one-slide',
        options: ['add-and-subtract', 'add-only', 'subtract-only', 'unchanged'],
        correct: 'add-and-subtract',
      },
    },
    {
      id: 'slide-to-the-end',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'left', target: minute('m4') },
        { type: 'move-pointer', pointerId: 'right', target: minute('m8') },
        ...mark(4, 8, 'focus'),
        { type: 'highlight', highlight: { target: minute('m2'), tone: 'done' } },
      ],
      check: { kind: 'predict', id: 'where-the-sliding-stops', correct: minute('m8') },
    },
    {
      id: 'cost-of-sliding',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'left' },
        { type: 'drop-pointer', pointerId: 'right' },
        ...mark(2, 6, 'done'),
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-the-fixed-window',
        options: ['linear', 'n-times-k', 'only-k', 'quadratic'],
        correct: 'linear',
      },
    },
    {
      id: 'grow-the-window',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'left', label: 'left', target: minute('m1') } },
        { type: 'point', pointer: { id: 'right', label: 'right', target: minute('m4') } },
        ...mark(1, 4, 'focus'),
      ],
      check: { kind: 'predict', id: 'where-right-stops', correct: minute('m4') },
    },
    {
      id: 'shrink-the-window',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'left', target: minute('m2') },
        ...mark(2, 4, 'focus'),
      ],
      check: {
        kind: 'choice',
        id: 'what-happens-at-twelve',
        options: ['shrink-from-left', 'keep-growing', 'stop-now', 'restart'],
        correct: 'shrink-from-left',
      },
    },
    {
      id: 'grow-and-shrink-again',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'right', target: minute('m6') },
        { type: 'move-pointer', pointerId: 'left', target: minute('m3') },
        ...mark(3, 6, 'focus'),
      ],
    },
    {
      id: 'the-shortest-stretch',
      kind: 'explain',
      events: [
        { type: 'move-pointer', pointerId: 'left', target: minute('m4') },
        ...mark(4, 6, 'done'),
      ],
      check: { kind: 'predict', id: 'where-left-stops', correct: minute('m4') },
    },
    {
      id: 'cost-of-resizing',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'left' },
        { type: 'drop-pointer', pointerId: 'right' },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-the-variable-window',
        options: ['both-forward', 'restart-each', 'n-log-n', 'only-the-window'],
        correct: 'both-forward',
      },
    },
    {
      id: 'busiest-window-in-practice',
      kind: 'explain',
      events: [],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [],
    },
  ],
};
