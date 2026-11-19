import { scenesOf } from '@/domain';
import type { Scene } from '@/domain';
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
  readonly head: string | null;
  readonly order: readonly string[];
  readonly nodes: readonly string[];
  readonly cells: readonly string[];
  readonly pointers: readonly string[];
}

function pointerLabels(scene: Scene): readonly string[] {
  return scene.pointers.map((pointer) => `${pointer.id}:${pointer.target?.elementId ?? 'null'}`);
}

function highlightLabels(scene: Scene): readonly string[] {
  return scene.highlights.map(
    (highlight) =>
      `${highlight.target.structureId}/${highlight.target.elementId}:${highlight.tone}`,
  );
}

type Trail = Extract<Scene['structures'][number], { kind: 'linked-list' }>;

function trailOf(scene: Scene): Trail | undefined {
  const found = scene.structures.find((structure) => structure.id === 'trail');
  return found?.kind === 'linked-list' ? found : undefined;
}

function cellsOf(scene: Scene): readonly string[] {
  const found = scene.structures.find((structure) => structure.id === 'sheet');
  return found?.kind === 'array' ? found.cells.map((cell) => String(cell.value)) : [];
}

function cluesFromHead(trail: Trail | undefined): readonly string[] {
  if (trail === undefined) return [];
  const valueOf = new Map(trail.nodes.map((node) => [node.id, String(node.value)]));
  const next = new Map(trail.nodes.map((node) => [node.id, node.next]));
  const order: string[] = [];
  for (let at = trail.head; at !== null; at = next.get(at) ?? null) {
    order.push(valueOf.get(at) ?? at);
  }
  return order;
}

function summarise(scene: Scene): Summary {
  const trail = trailOf(scene);
  const order = cluesFromHead(trail);
  return {
    structures: scene.structures.map((structure) => structure.id),
    head: order[0] ?? null,
    order,
    nodes: trail === undefined ? [] : trail.nodes.map((node) => String(node.value)),
    cells: cellsOf(scene),
    pointers: pointerLabels(scene),
  };
}

function sceneBefore(stepId: string): Scene {
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  if (index === -1) throw new Error(`unknown step ${stepId}`);
  if (index === 0) return lesson.initialScene;
  const scene = scenes[index - 1];
  if (scene === undefined) throw new Error(`no scene before ${stepId}`);
  return scene;
}

const firstFour = ['Mat', 'Mail', 'Oven', 'Shed'] as const;
const overviewTrail = ['Mat', 'Mail', 'Shed'] as const;
const afterAddedStop = ['Mat', 'Mail', 'Clock', 'Oven', 'Shed'] as const;
const afterRemoval = ['Mat', 'Mail', 'Clock', 'Shed'] as const;
const afterRemovalNodes = ['Mat', 'Mail', 'Shed', 'Clock'] as const;
const atMat = ['here:mat'] as const;
const atMail = ['here:mail'] as const;
const atShed = ['here:shed'] as const;

describe('linked lists Lesson', () => {
  it('is registered under foundations', () => {
    expect(lessonContent('foundations', 'linked-lists')).toBe(linkedListsContent);
  });

  it('lists its Steps in teaching order', () => {
    expect(lesson.steps.map((step) => step.id)).toEqual([
      'overview',
      'the-problem',
      'a-clue',
      'chaining-clues',
      'the-first-clue',
      'finger-on-a-clue',
      'following-the-trail',
      'add-a-stop',
      'remove-a-stop',
      'jump-to-a-clue',
      'sheet-vs-trail',
      'reverse-preview',
      'where-you-meet-it',
    ]);
  });

  it('opens with the Overview, then the only Problem Step', () => {
    expect(lesson.steps.map((step) => step.kind)).toEqual([
      'explain',
      'problem',
      ...lesson.steps.slice(2).map(() => 'explain'),
    ]);
  });

  it('gives the Overview no Check', () => {
    expect(lesson.steps[0]?.check).toBeUndefined();
  });

  it('reduces every Step to the expected Structures, head, clue order and Pointers', () => {
    expect(scenes.map(summarise)).toEqual([
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...overviewTrail],
        nodes: [...overviewTrail],
        cells: [],
        pointers: [],
      },
      {
        structures: ['sheet'],
        head: null,
        order: [],
        nodes: [],
        cells: [...afterAddedStop],
        pointers: [],
      },
      { structures: ['trail'], head: null, order: [], nodes: ['Mat'], cells: [], pointers: [] },
      {
        structures: ['trail'],
        head: null,
        order: [],
        nodes: [...firstFour],
        cells: [],
        pointers: [],
      },
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...firstFour],
        nodes: [...firstFour],
        cells: [],
        pointers: [],
      },
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...firstFour],
        nodes: [...firstFour],
        cells: [],
        pointers: [...atMat],
      },
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...firstFour],
        nodes: [...firstFour],
        cells: [],
        pointers: [...atShed],
      },
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...afterAddedStop],
        nodes: [...firstFour, 'Clock'],
        cells: [],
        pointers: [...atMail],
      },
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [],
        pointers: [...atMail],
      },
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [],
        pointers: [...atShed],
      },
      {
        structures: ['trail', 'sheet'],
        head: 'Mat',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [...afterRemoval],
        pointers: [...atShed],
      },
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [],
        pointers: ['prev:null', 'current:mat', 'next:mail'],
      },
      {
        structures: ['trail'],
        head: 'Mat',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [],
        pointers: [],
      },
    ]);
  });

  it('places each Check on its Step with its kind', () => {
    expect(
      lesson.steps.flatMap((step) =>
        step.check === undefined ? [] : [[step.id, step.check.id, step.check.kind]],
      ),
    ).toEqual([
      ['chaining-clues', 'what-a-clue-holds', 'choice'],
      ['the-first-clue', 'which-clue-is-first', 'predict'],
      ['following-the-trail', 'where-the-walk-lands', 'predict'],
      ['add-a-stop', 'first-rewrite-for-new-stop', 'choice'],
      ['remove-a-stop', 'clue-before-the-removed', 'predict'],
      ['jump-to-a-clue', 'cost-of-reaching-clue-k', 'choice'],
      ['sheet-vs-trail', 'cheaper-on-a-trail', 'choice'],
    ]);
  });

  it('answers each Predict Check with a node drawn before its Step', () => {
    const answers = lesson.steps.flatMap((step) =>
      step.check?.kind === 'predict'
        ? [{ step: step.id, element: step.check.correct.elementId }]
        : [],
    );
    expect(answers).toEqual([
      { step: 'the-first-clue', element: 'mat' },
      { step: 'following-the-trail', element: 'oven' },
      { step: 'remove-a-stop', element: 'clock' },
    ]);
    expect(
      answers.map(({ step, element }) => {
        const list = sceneBefore(step).structures.find((s) => s.id === 'trail');
        return list?.kind === 'linked-list' && list.nodes.some((n) => n.id === element);
      }),
    ).toEqual([true, true, true]);
  });

  it('poses each Check on a Scene with exactly these Pointers and Highlights', () => {
    const checked = lesson.steps.filter((step) => step.check !== undefined);
    expect(
      checked.map((step) => ({
        step: step.id,
        pointers: pointerLabels(sceneBefore(step.id)),
        highlights: highlightLabels(sceneBefore(step.id)),
      })),
    ).toEqual([
      { step: 'chaining-clues', pointers: [], highlights: [] },
      { step: 'the-first-clue', pointers: [], highlights: [] },
      { step: 'following-the-trail', pointers: [...atMat], highlights: [] },
      { step: 'add-a-stop', pointers: [...atShed], highlights: [] },
      { step: 'remove-a-stop', pointers: [...atMail], highlights: [] },
      { step: 'jump-to-a-clue', pointers: [...atMail], highlights: [] },
      { step: 'sheet-vs-trail', pointers: [...atShed], highlights: [] },
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
      { step: 'the-first-clue', pointed: false, highlighted: false },
      { step: 'following-the-trail', pointed: false, highlighted: false },
      { step: 'remove-a-stop', pointed: false, highlighted: false },
    ]);
  });

  it('previews the reversal with the prev, current and next Pointers', () => {
    expect(sceneBefore('where-you-meet-it').pointers).toEqual([
      { id: 'prev', label: 'prev', target: null },
      { id: 'current', label: 'current', target: { structureId: 'trail', elementId: 'mat' } },
      { id: 'next', label: 'next', target: { structureId: 'trail', elementId: 'mail' } },
    ]);
  });
});
