import type { ElementRef, Lesson } from '@/domain';

function node(id: string): ElementRef {
  return { structureId: 'list', elementId: id };
}

function cell(structureId: string, id: string): ElementRef {
  return { structureId, elementId: id };
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
            id: 'tasks',
            cells: [
              { id: 'cell-a', value: 'A' },
              { id: 'cell-b', value: 'B' },
              { id: 'cell-c', value: 'C' },
              { id: 'cell-d', value: 'D' },
            ],
          },
        },
        {
          type: 'insert-cell',
          structureId: 'tasks',
          index: 0,
          cell: { id: 'cell-z', value: 'Z' },
        },
        { type: 'highlight', highlight: { target: cell('tasks', 'cell-z'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: cell('tasks', 'cell-a'), tone: 'error' } },
        { type: 'highlight', highlight: { target: cell('tasks', 'cell-b'), tone: 'error' } },
        { type: 'highlight', highlight: { target: cell('tasks', 'cell-c'), tone: 'error' } },
        { type: 'highlight', highlight: { target: cell('tasks', 'cell-d'), tone: 'error' } },
      ],
    },
    {
      id: 'a-node',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'tasks' },
        { type: 'clear-highlights' },
        {
          type: 'create',
          structure: {
            kind: 'linked-list',
            id: 'list',
            nodes: [{ id: 'node-a', value: 'A', next: null }],
            head: null,
          },
        },
        { type: 'highlight', highlight: { target: node('node-a'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'what-a-node-holds',
        options: ['next-link', 'index', 'previous-link'],
        correct: 'next-link',
      },
    },
    {
      id: 'linking-nodes',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'add-node', structureId: 'list', node: { id: 'node-b', value: 'B', next: null } },
        { type: 'add-node', structureId: 'list', node: { id: 'node-c', value: 'C', next: null } },
        { type: 'add-node', structureId: 'list', node: { id: 'node-d', value: 'D', next: null } },
        { type: 'link', structureId: 'list', from: 'node-a', to: 'node-b' },
        { type: 'link', structureId: 'list', from: 'node-b', to: 'node-c' },
        { type: 'link', structureId: 'list', from: 'node-c', to: 'node-d' },
      ],
    },
    {
      id: 'the-head',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'set-head', structureId: 'list', head: 'node-a' },
        { type: 'highlight', highlight: { target: node('node-a'), tone: 'focus' } },
      ],
      check: { kind: 'predict', id: 'which-node-becomes-head', correct: node('node-a') },
    },
    {
      id: 'current-pointer',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'point', pointer: { id: 'current', label: 'current', target: node('node-a') } },
        { type: 'move-pointer', pointerId: 'current', target: node('node-b') },
        { type: 'highlight', highlight: { target: node('node-b'), tone: 'focus' } },
      ],
    },
    {
      id: 'traversal',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'move-pointer', pointerId: 'current', target: node('node-c') },
        { type: 'move-pointer', pointerId: 'current', target: node('node-d') },
        { type: 'drop-pointer', pointerId: 'current' },
      ],
      check: { kind: 'predict', id: 'where-current-moves', correct: node('node-c') },
    },
    {
      id: 'insert-at-head',
      kind: 'explain',
      events: [
        { type: 'add-node', structureId: 'list', node: { id: 'node-z', value: 'Z', next: null } },
        { type: 'link', structureId: 'list', from: 'node-z', to: 'node-a' },
        { type: 'set-head', structureId: 'list', head: 'node-z' },
        { type: 'highlight', highlight: { target: node('node-z'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-insert-at-head',
        options: ['constant', 'shift-everything', 'walk-to-the-end', 'update-every-link'],
        correct: 'constant',
      },
    },
    {
      id: 'insert-after',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'point', pointer: { id: 'prev', label: 'prev', target: node('node-a') } },
        { type: 'add-node', structureId: 'list', node: { id: 'node-x', value: 'X', next: null } },
        { type: 'link', structureId: 'list', from: 'node-x', to: 'node-b' },
        { type: 'link', structureId: 'list', from: 'node-a', to: 'node-x' },
        { type: 'highlight', highlight: { target: node('node-x'), tone: 'focus' } },
      ],
      check: {
        kind: 'choice',
        id: 'first-link-to-change',
        options: ['new-to-next', 'prev-to-new', 'new-to-prev', 'either-order'],
        correct: 'new-to-next',
      },
    },
    {
      id: 'delete-after',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'link', structureId: 'list', from: 'node-a', to: 'node-b' },
        { type: 'remove-node', target: node('node-x') },
        { type: 'highlight', highlight: { target: node('node-a'), tone: 'done' } },
      ],
      check: { kind: 'predict', id: 'prev-next-after-deletion', correct: node('node-b') },
    },
    {
      id: 'access-by-index',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'prev' },
        { type: 'clear-highlights' },
        { type: 'point', pointer: { id: 'current', label: 'current', target: node('node-z') } },
        { type: 'move-pointer', pointerId: 'current', target: node('node-a') },
        { type: 'move-pointer', pointerId: 'current', target: node('node-b') },
        { type: 'move-pointer', pointerId: 'current', target: node('node-c') },
        { type: 'drop-pointer', pointerId: 'current' },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-reaching-index-k',
        options: ['k-moves', 'one-move', 'whole-list', 'halving'],
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
            id: 'cells',
            cells: [
              { id: 'slot-z', value: 'Z' },
              { id: 'slot-a', value: 'A' },
              { id: 'slot-b', value: 'B' },
              { id: 'slot-c', value: 'C' },
              { id: 'slot-d', value: 'D' },
            ],
          },
        },
        { type: 'highlight', highlight: { target: cell('cells', 'slot-c'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: node('node-c'), tone: 'compare' } },
      ],
      check: {
        kind: 'choice',
        id: 'cheaper-on-a-list',
        options: ['insert-at-front', 'read-by-index', 'visit-every-element'],
        correct: 'insert-at-front',
      },
    },
    {
      id: 'reverse-preview',
      kind: 'explain',
      events: [
        { type: 'remove', structureId: 'cells' },
        { type: 'clear-highlights' },
        { type: 'point', pointer: { id: 'prev', label: 'prev', target: null } },
        { type: 'point', pointer: { id: 'current', label: 'current', target: node('node-z') } },
        { type: 'point', pointer: { id: 'next', label: 'next', target: node('node-a') } },
        { type: 'highlight', highlight: { target: node('node-z'), tone: 'focus' } },
      ],
    },
  ],
};
