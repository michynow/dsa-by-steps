import { scenesOf } from '@/domain';
import type { ElementId, Scene } from '@/domain';
import { lessonContent } from '../../registry';
import { linkedListsContent } from './index';

const lesson = linkedListsContent.lesson;

function reduced(): readonly Scene[] {
  const result = scenesOf(lesson);
  if (!result.ok) throw new Error(`scenesOf failed: ${JSON.stringify(result.error)}`);
  return result.value;
}

const scenes = reduced();

interface Summary {
  readonly structures: readonly string[];
  readonly list: {
    readonly head: ElementId | null;
    readonly order: readonly ElementId[];
    readonly nodes: readonly ElementId[];
  } | null;
  readonly pointers: readonly string[];
}

function summarise(scene: Scene): Summary {
  const list = scene.structures.find((structure) => structure.id === 'list');
  const order: ElementId[] = [];
  if (list?.kind === 'linked-list') {
    let current = list.head;
    while (current !== null) {
      order.push(current);
      const at: ElementId = current;
      current = list.nodes.find((node) => node.id === at)?.next ?? null;
    }
  }
  return {
    structures: scene.structures.map((structure) => structure.id),
    list:
      list?.kind === 'linked-list'
        ? { head: list.head, order, nodes: list.nodes.map((node) => node.id) }
        : null,
    pointers: scene.pointers.map(
      (pointer) => `${pointer.id}:${pointer.target?.elementId ?? 'null'}`,
    ),
  };
}

function sceneAt(stepId: string): Scene {
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  const scene = scenes[index];
  if (scene === undefined) throw new Error(`no scene for ${stepId}`);
  return scene;
}

function sceneBefore(stepId: string): Scene {
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  return index === 0 ? lesson.initialScene : (scenes[index - 1] ?? lesson.initialScene);
}

const abcd = ['node-a', 'node-b', 'node-c', 'node-d'] as const;
const zabcd = ['node-z', 'node-a', 'node-b', 'node-c', 'node-d'] as const;
const withZ = ['node-a', 'node-b', 'node-c', 'node-d', 'node-z'] as const;

describe('linked lists Lesson', () => {
  it('is registered under foundations', () => {
    expect(lessonContent('foundations', 'linked-lists')).toBe(linkedListsContent);
  });

  it('lists its Steps in teaching order', () => {
    expect(lesson.steps.map((step) => step.id)).toEqual([
      'the-problem',
      'a-node',
      'linking-nodes',
      'the-head',
      'current-pointer',
      'traversal',
      'insert-at-head',
      'insert-after',
      'delete-after',
      'access-by-index',
      'arrays-vs-lists',
      'reverse-preview',
    ]);
  });

  it('opens with the only Problem Step', () => {
    expect(lesson.steps.map((step) => step.kind)).toEqual([
      'problem',
      ...lesson.steps.slice(1).map(() => 'explain'),
    ]);
  });

  it('reduces every Step to the expected Structures, list order and Pointers', () => {
    expect(scenes.map(summarise)).toEqual([
      { structures: ['tasks'], list: null, pointers: [] },
      { structures: ['list'], list: { head: null, order: [], nodes: ['node-a'] }, pointers: [] },
      { structures: ['list'], list: { head: null, order: [], nodes: [...abcd] }, pointers: [] },
      {
        structures: ['list'],
        list: { head: 'node-a', order: [...abcd], nodes: [...abcd] },
        pointers: [],
      },
      {
        structures: ['list'],
        list: { head: 'node-a', order: [...abcd], nodes: [...abcd] },
        pointers: ['current:node-b'],
      },
      {
        structures: ['list'],
        list: { head: 'node-a', order: [...abcd], nodes: [...abcd] },
        pointers: [],
      },
      {
        structures: ['list'],
        list: { head: 'node-z', order: [...zabcd], nodes: [...withZ] },
        pointers: [],
      },
      {
        structures: ['list'],
        list: {
          head: 'node-z',
          order: ['node-z', 'node-a', 'node-x', 'node-b', 'node-c', 'node-d'],
          nodes: [...withZ, 'node-x'],
        },
        pointers: ['prev:node-a'],
      },
      {
        structures: ['list'],
        list: { head: 'node-z', order: [...zabcd], nodes: [...withZ] },
        pointers: ['prev:node-a'],
      },
      {
        structures: ['list'],
        list: { head: 'node-z', order: [...zabcd], nodes: [...withZ] },
        pointers: [],
      },
      {
        structures: ['list', 'cells'],
        list: { head: 'node-z', order: [...zabcd], nodes: [...withZ] },
        pointers: [],
      },
      {
        structures: ['list'],
        list: { head: 'node-z', order: [...zabcd], nodes: [...withZ] },
        pointers: ['prev:null', 'current:node-z', 'next:node-a'],
      },
    ]);
  });

  it('places each Check on its Step with its kind', () => {
    expect(
      lesson.steps.flatMap((step) =>
        step.check === undefined ? [] : [[step.id, step.check.id, step.check.kind]],
      ),
    ).toEqual([
      ['a-node', 'what-a-node-holds', 'choice'],
      ['the-head', 'which-node-becomes-head', 'predict'],
      ['traversal', 'where-current-moves', 'predict'],
      ['insert-at-head', 'cost-of-insert-at-head', 'choice'],
      ['insert-after', 'first-link-to-change', 'choice'],
      ['delete-after', 'prev-next-after-deletion', 'predict'],
      ['access-by-index', 'cost-of-reaching-index-k', 'choice'],
      ['arrays-vs-lists', 'cheaper-on-a-list', 'choice'],
    ]);
  });

  it('answers each Predict Check with a node drawn before its Step', () => {
    const answers = lesson.steps.flatMap((step) =>
      step.check?.kind === 'predict' ? [[step.id, step.check.correct.elementId]] : [],
    );
    expect(answers).toEqual([
      ['the-head', 'node-a'],
      ['traversal', 'node-c'],
      ['delete-after', 'node-b'],
    ]);
    expect(
      answers.map(([stepId, elementId]) => {
        const list = sceneBefore(stepId ?? '').structures.find((s) => s.id === 'list');
        return list?.kind === 'linked-list' && list.nodes.some((n) => n.id === elementId);
      }),
    ).toEqual([true, true, true]);
  });

  it('poses each Check on a Scene with exactly these Pointers and Highlights', () => {
    const checked = lesson.steps.filter((step) => step.check !== undefined);
    expect(
      checked.map((step) => {
        const before = sceneBefore(step.id);
        return {
          step: step.id,
          pointers: before.pointers.map(
            (pointer) => `${pointer.id}:${pointer.target?.elementId ?? 'null'}`,
          ),
          highlights: before.highlights.map(
            (highlight) =>
              `${highlight.target.structureId}/${highlight.target.elementId}:${highlight.tone}`,
          ),
        };
      }),
    ).toEqual([
      {
        step: 'a-node',
        pointers: [],
        highlights: [
          'tasks/cell-z:focus',
          'tasks/cell-a:error',
          'tasks/cell-b:error',
          'tasks/cell-c:error',
          'tasks/cell-d:error',
        ],
      },
      { step: 'the-head', pointers: [], highlights: [] },
      { step: 'traversal', pointers: ['current:node-b'], highlights: ['list/node-b:focus'] },
      { step: 'insert-at-head', pointers: [], highlights: [] },
      { step: 'insert-after', pointers: [], highlights: ['list/node-z:focus'] },
      { step: 'delete-after', pointers: ['prev:node-a'], highlights: ['list/node-x:focus'] },
      { step: 'access-by-index', pointers: ['prev:node-a'], highlights: ['list/node-a:done'] },
      { step: 'arrays-vs-lists', pointers: [], highlights: [] },
    ]);
  });

  it('never marks a Predict answer with a Pointer or Highlight before its Step', () => {
    const marked = lesson.steps.flatMap((step) => {
      if (step.check?.kind !== 'predict') return [];
      const answer = step.check.correct;
      const before = sceneBefore(step.id);
      return [
        {
          step: step.id,
          pointed: before.pointers.some((p) => p.target?.elementId === answer.elementId),
          highlighted: before.highlights.some((h) => h.target.elementId === answer.elementId),
        },
      ];
    });
    expect(marked).toEqual([
      { step: 'the-head', pointed: false, highlighted: false },
      { step: 'traversal', pointed: false, highlighted: false },
      { step: 'delete-after', pointed: false, highlighted: false },
    ]);
  });

  it('ends with the prev, current and next Pointers', () => {
    expect(sceneAt('reverse-preview').pointers).toEqual([
      { id: 'prev', label: 'prev', target: null },
      { id: 'current', label: 'current', target: { structureId: 'list', elementId: 'node-z' } },
      { id: 'next', label: 'next', target: { structureId: 'list', elementId: 'node-a' } },
    ]);
  });
});
