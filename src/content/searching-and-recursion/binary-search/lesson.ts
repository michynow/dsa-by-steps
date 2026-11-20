import type { Cell, ElementRef, Lesson } from '@/domain';

function commit(id: string): ElementRef {
  return { structureId: 'history', elementId: id };
}

function cell(id: string): Cell {
  return { id, value: id };
}

export const binarySearchLesson: Lesson = {
  slug: 'binary-search',
  outcomes: [
    'pick-the-middle',
    'discard-half',
    'keep-the-boundary',
    'state-the-invariant',
    'count-the-builds',
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
            id: 'history',
            cells: [
              cell('c1'),
              cell('c2'),
              cell('c3'),
              cell('c4'),
              cell('c5'),
              cell('c6'),
              cell('c7'),
              cell('c8'),
            ],
          },
        },
        { type: 'point', pointer: { id: 'lo', label: 'lo', target: commit('c6') } },
        { type: 'point', pointer: { id: 'mid', label: 'mid', target: commit('c6') } },
        { type: 'point', pointer: { id: 'hi', label: 'hi', target: commit('c6') } },
        { type: 'highlight', highlight: { target: commit('c6'), tone: 'done' } },
      ],
    },
    {
      id: 'the-problem',
      kind: 'problem',
      events: [
        { type: 'drop-pointer', pointerId: 'lo' },
        { type: 'drop-pointer', pointerId: 'mid' },
        { type: 'drop-pointer', pointerId: 'hi' },
      ],
    },
    {
      id: 'the-two-ends',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'lo', label: 'lo', target: commit('c1') } },
        { type: 'point', pointer: { id: 'hi', label: 'hi', target: commit('c8') } },
      ],
    },
    {
      id: 'pick-the-middle',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'mid', label: 'mid', target: commit('c4') } },
        { type: 'highlight', highlight: { target: commit('c4'), tone: 'focus' } },
      ],
      check: { kind: 'predict', id: 'where-the-middle-is', correct: commit('c4') },
    },
    {
      id: 'test-the-middle',
      kind: 'explain',
      events: [{ type: 'highlight', highlight: { target: commit('c4'), tone: 'done' } }],
      check: {
        kind: 'choice',
        id: 'where-the-break-can-be',
        options: ['after-the-middle', 'same-side', 'anywhere', 'right-next-one'],
        correct: 'after-the-middle',
      },
    },
    {
      id: 'discard-half',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: commit('c1'), tone: 'done' } },
        { type: 'highlight', highlight: { target: commit('c2'), tone: 'done' } },
        { type: 'highlight', highlight: { target: commit('c3'), tone: 'done' } },
        { type: 'highlight', highlight: { target: commit('c4'), tone: 'done' } },
        { type: 'move-pointer', pointerId: 'lo', target: commit('c5') },
        { type: 'move-pointer', pointerId: 'mid', target: commit('c6') },
      ],
      check: { kind: 'predict', id: 'where-lo-lands', correct: commit('c5') },
    },
    {
      id: 'keep-the-boundary',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: commit('c6'), tone: 'error' } },
        { type: 'move-pointer', pointerId: 'hi', target: commit('c6') },
      ],
      check: {
        kind: 'choice',
        id: 'where-hi-lands',
        options: ['hi-on-the-middle', 'hi-before-the-middle', 'hi-stays', 'hi-after-the-middle'],
        correct: 'hi-on-the-middle',
      },
    },
    {
      id: 'the-range-of-two',
      kind: 'explain',
      events: [{ type: 'move-pointer', pointerId: 'mid', target: commit('c5') }],
      check: {
        kind: 'choice',
        id: 'which-commit-is-built-next',
        options: ['rounds-down', 'rounds-up', 'no-build', 'past-the-end'],
        correct: 'rounds-down',
      },
    },
    {
      id: 'the-pointers-meet',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: commit('c5'), tone: 'done' } },
        { type: 'move-pointer', pointerId: 'lo', target: commit('c6') },
        { type: 'highlight', highlight: { target: commit('c6'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'why-the-search-stops',
        options: ['one-candidate-left', 'last-one-tested', 'confirm-with-a-build', 'keep-halving'],
        correct: 'one-candidate-left',
      },
    },
    {
      id: 'the-invariant',
      kind: 'explain',
      events: [{ type: 'highlight', highlight: { target: commit('c6'), tone: 'done' } }],
    },
    {
      id: 'count-the-builds',
      kind: 'explain',
      events: [
        { type: 'highlight', highlight: { target: commit('c4'), tone: 'done' } },
        { type: 'highlight', highlight: { target: commit('c5'), tone: 'done' } },
        { type: 'highlight', highlight: { target: commit('c6'), tone: 'done' } },
      ],
      check: {
        kind: 'choice',
        id: 'builds-for-a-million-commits',
        options: ['about-twenty', 'about-a-thousand', 'half-a-million', 'a-million'],
        correct: 'about-twenty',
      },
    },
    {
      id: 'look-up-many-reports',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'mid' },
        { type: 'highlight', highlight: { target: commit('c6'), tone: 'focus' } },
      ],
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'lo' },
        { type: 'drop-pointer', pointerId: 'hi' },
      ],
    },
  ],
};
