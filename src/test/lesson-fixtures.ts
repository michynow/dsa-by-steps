import type { Lesson, Step } from '@/domain';
import { cell, sceneOf, stackOf } from './scene-fixtures';

const initialScene = sceneOf([stackOf('s', 'i0')]);

const push = (id: string, kind: Step['kind'], cellId: string): Step => ({
  id,
  kind,
  events: [{ type: 'push', structureId: 's', cell: cell(cellId) }],
});

const stacks: Lesson = {
  slug: 'stacks',
  outcomes: ['o1'],
  initialScene,
  steps: [
    push('why', 'problem', 'i1'),
    {
      ...push('push', 'explain', 'i2'),
      check: { kind: 'choice', id: 'c-push', options: ['a', 'b'], correct: 'a' },
    },
    { id: 'pop', kind: 'explain', events: [{ type: 'pop', structureId: 's' }] },
  ],
};

const queues: Lesson = {
  slug: 'queues',
  outcomes: [],
  initialScene,
  steps: [
    {
      ...push('q-one', 'explain', 'j1'),
      check: { kind: 'choice', id: 'c-enqueue', options: ['a', 'b'], correct: 'b' },
    },
    push('q-two', 'explain', 'j2'),
  ],
};

const bare: Lesson = { slug: 'bare', outcomes: [], initialScene, steps: [] };

const stepMessages = (title: string) => ({ title, caption: `${title} caption` });

const stackMessages = (prefix: string) => ({
  title: `${prefix}Stacks`,
  outcomes: { o1: `${prefix}Push and pop` },
  steps: {
    why: stepMessages(`${prefix}Why stacks`),
    push: stepMessages(`${prefix}Push one`),
    pop: stepMessages(`${prefix}Pop one`),
  },
  checks: {
    'c-push': {
      prompt: `${prefix}Where does it go?`,
      options: { a: 'on top', b: 'below' },
      explanation: `${prefix}On top.`,
    },
  },
  terms: { stack: { term: 'stack', gloss: `${prefix}last in, first out` } },
});

const queueMessages = (prefix: string) => ({
  title: `${prefix}Queues`,
  outcomes: {},
  steps: {
    'q-one': stepMessages(`${prefix}Enqueue`),
    'q-two': stepMessages(`${prefix}Enqueue again`),
  },
  checks: {
    'c-enqueue': {
      prompt: `${prefix}Where does it go?`,
      options: { a: 'front', b: 'back' },
      explanation: `${prefix}At the back.`,
    },
  },
  terms: {},
});

const bareMessages = (prefix: string) => ({
  title: `${prefix}Bare`,
  outcomes: {},
  steps: {},
  checks: {},
  terms: {},
});

export const testModules = [
  {
    slug: 'basics',
    titles: { en: 'Basics', pl: 'Podstawy' },
    lessons: [
      {
        module: 'basics',
        lesson: stacks,
        terms: ['stack'],
        messages: { en: stackMessages(''), pl: stackMessages('PL ') },
      },
      {
        module: 'basics',
        lesson: queues,
        terms: [],
        messages: { en: queueMessages(''), pl: queueMessages('PL ') },
      },
    ],
  },
  { slug: 'empty', titles: { en: 'Empty module', pl: 'Pusty moduł' }, lessons: [] },
  {
    slug: 'solo',
    titles: { en: 'Solo', pl: 'Solo' },
    lessons: [
      {
        module: 'solo',
        lesson: bare,
        terms: [],
        messages: { en: bareMessages(''), pl: bareMessages('PL ') },
      },
    ],
  },
];
