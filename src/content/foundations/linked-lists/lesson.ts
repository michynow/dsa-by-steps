import type { ElementRef, Lesson } from '@/domain';

function song(id: string): ElementRef {
  return { structureId: 'queue', elementId: id };
}

function slot(id: string): ElementRef {
  return { structureId: 'queue-array', elementId: id };
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
      id: 'the-problem',
      kind: 'problem',
      events: [
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'queue-array',
            cells: [
              { id: 'slot-intro', value: 'Intro' },
              { id: 'slot-echo', value: 'Echo' },
              { id: 'slot-drift', value: 'Drift' },
              { id: 'slot-pulse', value: 'Pulse' },
            ],
          },
        },
        {
          type: 'insert-cell',
          structureId: 'queue-array',
          index: 1,
          cell: { id: 'slot-glow', value: 'Glow' },
        },
        { type: 'highlight', highlight: { target: slot('slot-glow'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: slot('slot-echo'), tone: 'error' } },
        { type: 'highlight', highlight: { target: slot('slot-drift'), tone: 'error' } },
        { type: 'highlight', highlight: { target: slot('slot-pulse'), tone: 'error' } },
      ],
    },
    {
      id: 'a-node',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'queue-array' },
        { type: 'clear-highlights' },
        {
          type: 'create',
          structure: {
            kind: 'linked-list',
            id: 'queue',
            nodes: [{ id: 'intro', value: 'Intro', next: null }],
            head: null,
          },
        },
      ],
    },
    {
      id: 'linking-songs',
      kind: 'explain',
      events: [
        { type: 'add-node', structureId: 'queue', node: { id: 'echo', value: 'Echo', next: null } },
        {
          type: 'add-node',
          structureId: 'queue',
          node: { id: 'drift', value: 'Drift', next: null },
        },
        {
          type: 'add-node',
          structureId: 'queue',
          node: { id: 'pulse', value: 'Pulse', next: null },
        },
        { type: 'link', structureId: 'queue', from: 'intro', to: 'echo' },
        { type: 'link', structureId: 'queue', from: 'echo', to: 'drift' },
        { type: 'link', structureId: 'queue', from: 'drift', to: 'pulse' },
      ],
      check: {
        kind: 'choice',
        id: 'what-a-node-links-to',
        options: ['next-link', 'copy-of-next', 'position-number', 'nothing-extra'],
        correct: 'next-link',
      },
    },
    {
      id: 'the-head',
      kind: 'explain',
      events: [
        { type: 'set-head', structureId: 'queue', head: 'intro' },
        { type: 'highlight', highlight: { target: song('intro'), tone: 'focus' } },
      ],
      check: { kind: 'predict', id: 'which-song-is-head', correct: song('intro') },
    },
    {
      id: 'now-playing-pointer',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        {
          type: 'point',
          pointer: { id: 'now-playing', label: 'now-playing', target: song('intro') },
        },
      ],
    },
    {
      id: 'traversal',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'cursor', label: 'cursor', target: song('intro') } },
        { type: 'move-pointer', pointerId: 'cursor', target: song('echo') },
        { type: 'move-pointer', pointerId: 'cursor', target: song('drift') },
        { type: 'move-pointer', pointerId: 'cursor', target: song('pulse') },
        { type: 'drop-pointer', pointerId: 'cursor' },
      ],
      check: { kind: 'predict', id: 'where-the-walk-lands', correct: song('drift') },
    },
    {
      id: 'play-next',
      kind: 'explain',
      events: [
        { type: 'add-node', structureId: 'queue', node: { id: 'glow', value: 'Glow', next: null } },
        { type: 'highlight', highlight: { target: song('glow'), tone: 'focus' } },
        { type: 'link', structureId: 'queue', from: 'glow', to: 'echo' },
        { type: 'link', structureId: 'queue', from: 'intro', to: 'glow' },
        { type: 'clear-highlights' },
      ],
      check: {
        kind: 'choice',
        id: 'first-link-for-play-next',
        options: ['new-to-next', 'current-to-new', 'new-to-current', 'either-order'],
        correct: 'new-to-next',
      },
    },
    {
      id: 'remove-from-queue',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'prev', label: 'prev', target: song('glow') } },
        { type: 'highlight', highlight: { target: song('echo'), tone: 'error' } },
        { type: 'link', structureId: 'queue', from: 'glow', to: 'drift' },
        { type: 'remove-node', target: song('echo') },
        { type: 'drop-pointer', pointerId: 'prev' },
      ],
      check: { kind: 'predict', id: 'song-before-the-removed', correct: song('glow') },
    },
    {
      id: 'jump-to-song',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'cursor', label: 'cursor', target: song('intro') } },
        { type: 'move-pointer', pointerId: 'cursor', target: song('glow') },
        { type: 'move-pointer', pointerId: 'cursor', target: song('drift') },
        { type: 'move-pointer', pointerId: 'cursor', target: song('pulse') },
        { type: 'drop-pointer', pointerId: 'cursor' },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-reaching-index-k',
        options: ['k-moves', 'one-move', 'whole-queue', 'halving'],
        correct: 'k-moves',
      },
    },
    {
      id: 'arrays-vs-lists',
      kind: 'explain',
      events: [
        {
          type: 'create',
          structure: {
            kind: 'array',
            id: 'queue-array',
            cells: [
              { id: 'slot-intro', value: 'Intro' },
              { id: 'slot-glow', value: 'Glow' },
              { id: 'slot-drift', value: 'Drift' },
              { id: 'slot-pulse', value: 'Pulse' },
            ],
          },
        },
        { type: 'highlight', highlight: { target: slot('slot-pulse'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: song('pulse'), tone: 'compare' } },
      ],
      check: {
        kind: 'choice',
        id: 'cheaper-on-a-list',
        options: ['insert-after-current', 'read-by-index', 'show-every-song'],
        correct: 'insert-after-current',
      },
    },
    {
      id: 'where-you-meet-it',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'queue-array' },
        { type: 'clear-highlights' },
        { type: 'drop-pointer', pointerId: 'now-playing' },
      ],
    },
    {
      id: 'reverse-preview',
      kind: 'explain',
      events: [
        { type: 'point', pointer: { id: 'prev', label: 'prev', target: null } },
        { type: 'point', pointer: { id: 'current', label: 'current', target: song('intro') } },
        { type: 'point', pointer: { id: 'next', label: 'next', target: song('glow') } },
        { type: 'highlight', highlight: { target: song('intro'), tone: 'focus' } },
      ],
    },
  ],
};
