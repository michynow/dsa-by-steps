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
    },
    {
      id: 'linking-nodes',
      kind: 'explain',
      events: [
        { type: 'add-node', structureId: 'list', node: { id: 'node-b', value: 'B', next: null } },
        { type: 'add-node', structureId: 'list', node: { id: 'node-c', value: 'C', next: null } },
        { type: 'link', structureId: 'list', from: 'node-a', to: 'node-b' },
        { type: 'link', structureId: 'list', from: 'node-b', to: 'node-c' },
        { type: 'set-head', structureId: 'list', head: 'node-a' },
        { type: 'highlight', highlight: { target: node('node-a'), tone: 'focus' } },
      ],
      check: { kind: 'predict', id: 'which-node-is-last', correct: node('node-c') },
    },
    {
      id: 'traversal',
      kind: 'explain',
      events: [
        { type: 'clear-highlights' },
        { type: 'point', pointer: { id: 'current', label: 'current', target: node('node-a') } },
        { type: 'highlight', highlight: { target: node('node-a'), tone: 'done' } },
        { type: 'move-pointer', pointerId: 'current', target: node('node-b') },
        { type: 'highlight', highlight: { target: node('node-b'), tone: 'focus' } },
      ],
      check: { kind: 'predict', id: 'where-current-moves', correct: node('node-c') },
    },
    {
      id: 'insert-at-head',
      kind: 'explain',
      events: [
        { type: 'drop-pointer', pointerId: 'current' },
        { type: 'clear-highlights' },
        { type: 'add-node', structureId: 'list', node: { id: 'node-z', value: 'Z', next: null } },
        { type: 'link', structureId: 'list', from: 'node-z', to: 'node-a' },
        { type: 'set-head', structureId: 'list', head: 'node-z' },
        { type: 'highlight', highlight: { target: node('node-z'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: node('node-a'), tone: 'compare' } },
      ],
      check: {
        kind: 'choice',
        id: 'cost-of-insert-at-head',
        options: ['constant', 'shift-everything', 'walk-to-the-end', 'halving'],
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
        { type: 'highlight', highlight: { target: node('node-b'), tone: 'compare' } },
      ],
      check: {
        kind: 'choice',
        id: 'first-link-to-change',
        options: ['new-to-next', 'prev-to-new', 'either-order', 'head-to-new'],
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
        { type: 'highlight', highlight: { target: node('node-z'), tone: 'done' } },
        { type: 'highlight', highlight: { target: node('node-a'), tone: 'done' } },
        { type: 'highlight', highlight: { target: node('node-b'), tone: 'done' } },
        { type: 'highlight', highlight: { target: node('node-c'), tone: 'focus' } },
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
        { type: 'drop-pointer', pointerId: 'current' },
        { type: 'clear-highlights' },
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
            ],
          },
        },
        { type: 'highlight', highlight: { target: cell('cells', 'slot-c'), tone: 'focus' } },
        { type: 'highlight', highlight: { target: node('node-c'), tone: 'compare' } },
        { type: 'highlight', highlight: { target: node('node-z'), tone: 'done' } },
      ],
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
        { type: 'highlight', highlight: { target: node('node-a'), tone: 'compare' } },
      ],
    },
  ],
};
