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

type Queue = Extract<Scene['structures'][number], { kind: 'linked-list' }>;

function queueOf(scene: Scene): Queue | undefined {
  const found = scene.structures.find((structure) => structure.id === 'queue');
  return found?.kind === 'linked-list' ? found : undefined;
}

function cellsOf(scene: Scene): readonly string[] {
  const found = scene.structures.find((structure) => structure.id === 'queue-array');
  return found?.kind === 'array' ? found.cells.map((cell) => String(cell.value)) : [];
}

function songsFromHead(queue: Queue | undefined): readonly string[] {
  if (queue === undefined) return [];
  const valueOf = new Map(queue.nodes.map((node) => [node.id, String(node.value)]));
  const next = new Map(queue.nodes.map((node) => [node.id, node.next]));
  const order: string[] = [];
  for (let at = queue.head; at !== null; at = next.get(at) ?? null) {
    order.push(valueOf.get(at) ?? at);
  }
  return order;
}

function summarise(scene: Scene): Summary {
  const queue = queueOf(scene);
  const order = songsFromHead(queue);
  return {
    structures: scene.structures.map((structure) => structure.id),
    head: order[0] ?? null,
    order,
    nodes: queue === undefined ? [] : queue.nodes.map((node) => String(node.value)),
    cells: cellsOf(scene),
    pointers: pointerLabels(scene),
  };
}

function sceneBefore(stepId: string): Scene {
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  return index === 0 ? lesson.initialScene : (scenes[index - 1] ?? lesson.initialScene);
}

const firstFour = ['Intro', 'Echo', 'Drift', 'Pulse'] as const;
const afterPlayNext = ['Intro', 'Glow', 'Echo', 'Drift', 'Pulse'] as const;
const afterRemoval = ['Intro', 'Glow', 'Drift', 'Pulse'] as const;
const afterRemovalNodes = ['Intro', 'Drift', 'Pulse', 'Glow'] as const;
const nowPlaying = ['now-playing:intro'] as const;

describe('linked lists Lesson', () => {
  it('is registered under foundations', () => {
    expect(lessonContent('foundations', 'linked-lists')).toBe(linkedListsContent);
  });

  it('lists its Steps in teaching order', () => {
    expect(lesson.steps.map((step) => step.id)).toEqual([
      'the-problem',
      'a-node',
      'linking-songs',
      'the-head',
      'now-playing-pointer',
      'traversal',
      'play-next',
      'remove-from-queue',
      'jump-to-song',
      'arrays-vs-lists',
      'where-you-meet-it',
      'reverse-preview',
    ]);
  });

  it('opens with the only Problem Step', () => {
    expect(lesson.steps.map((step) => step.kind)).toEqual([
      'problem',
      ...lesson.steps.slice(1).map(() => 'explain'),
    ]);
  });

  it('reduces every Step to the expected Structures, head, song order and Pointers', () => {
    expect(scenes.map(summarise)).toEqual([
      {
        structures: ['queue-array'],
        head: null,
        order: [],
        nodes: [],
        cells: [...afterPlayNext],
        pointers: [],
      },
      { structures: ['queue'], head: null, order: [], nodes: ['Intro'], cells: [], pointers: [] },
      {
        structures: ['queue'],
        head: null,
        order: [],
        nodes: [...firstFour],
        cells: [],
        pointers: [],
      },
      {
        structures: ['queue'],
        head: 'Intro',
        order: [...firstFour],
        nodes: [...firstFour],
        cells: [],
        pointers: [],
      },
      {
        structures: ['queue'],
        head: 'Intro',
        order: [...firstFour],
        nodes: [...firstFour],
        cells: [],
        pointers: [...nowPlaying],
      },
      {
        structures: ['queue'],
        head: 'Intro',
        order: [...firstFour],
        nodes: [...firstFour],
        cells: [],
        pointers: [...nowPlaying],
      },
      {
        structures: ['queue'],
        head: 'Intro',
        order: [...afterPlayNext],
        nodes: [...firstFour, 'Glow'],
        cells: [],
        pointers: [...nowPlaying],
      },
      {
        structures: ['queue'],
        head: 'Intro',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [],
        pointers: [...nowPlaying],
      },
      {
        structures: ['queue'],
        head: 'Intro',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [],
        pointers: [...nowPlaying],
      },
      {
        structures: ['queue', 'queue-array'],
        head: 'Intro',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [...afterRemoval],
        pointers: [...nowPlaying],
      },
      {
        structures: ['queue'],
        head: 'Intro',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [],
        pointers: [],
      },
      {
        structures: ['queue'],
        head: 'Intro',
        order: [...afterRemoval],
        nodes: [...afterRemovalNodes],
        cells: [],
        pointers: ['prev:null', 'current:intro', 'next:glow'],
      },
    ]);
  });

  it('places each Check on its Step with its kind', () => {
    expect(
      lesson.steps.flatMap((step) =>
        step.check === undefined ? [] : [[step.id, step.check.id, step.check.kind]],
      ),
    ).toEqual([
      ['linking-songs', 'what-a-node-links-to', 'choice'],
      ['the-head', 'which-song-is-head', 'predict'],
      ['traversal', 'where-the-walk-lands', 'predict'],
      ['play-next', 'first-link-for-play-next', 'choice'],
      ['remove-from-queue', 'song-before-the-removed', 'predict'],
      ['jump-to-song', 'cost-of-reaching-index-k', 'choice'],
      ['arrays-vs-lists', 'cheaper-on-a-list', 'choice'],
    ]);
  });

  it('answers each Predict Check with a node drawn before its Step', () => {
    const answers = lesson.steps.flatMap((step) =>
      step.check?.kind === 'predict' ? [[step.id, step.check.correct.elementId]] : [],
    );
    expect(answers).toEqual([
      ['the-head', 'intro'],
      ['traversal', 'drift'],
      ['remove-from-queue', 'glow'],
    ]);
    expect(
      answers.map(([stepId, elementId]) => {
        const list = sceneBefore(stepId ?? '').structures.find((s) => s.id === 'queue');
        return list?.kind === 'linked-list' && list.nodes.some((n) => n.id === elementId);
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
      { step: 'linking-songs', pointers: [], highlights: [] },
      { step: 'the-head', pointers: [], highlights: [] },
      { step: 'traversal', pointers: [...nowPlaying], highlights: [] },
      { step: 'play-next', pointers: [...nowPlaying], highlights: [] },
      { step: 'remove-from-queue', pointers: [...nowPlaying], highlights: [] },
      { step: 'jump-to-song', pointers: [...nowPlaying], highlights: [] },
      { step: 'arrays-vs-lists', pointers: [...nowPlaying], highlights: [] },
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
      { step: 'remove-from-queue', pointed: false, highlighted: false },
    ]);
  });

  it('ends with the prev, current and next Pointers', () => {
    expect(scenes.at(-1)?.pointers).toEqual([
      { id: 'prev', label: 'prev', target: null },
      { id: 'current', label: 'current', target: { structureId: 'queue', elementId: 'intro' } },
      { id: 'next', label: 'next', target: { structureId: 'queue', elementId: 'glow' } },
    ]);
  });
});
