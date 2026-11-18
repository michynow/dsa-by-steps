import { scenesOf } from '@/domain';
import type { ElementId, Scene } from '@/domain';
import { lessonContent } from '../../registry';
import { linkedListsContent } from './index';

const lesson = linkedListsContent.lesson;

const scenesResult = scenesOf(lesson);
const scenes: readonly Scene[] = scenesResult.ok ? scenesResult.value : [];

function sceneAt(stepId: string): Scene {
  const index = lesson.steps.findIndex((step) => step.id === stepId);
  const scene = scenes[index];
  if (scene === undefined) throw new Error(`no scene for ${stepId}`);
  return scene;
}

function listAt(stepId: string): { head: ElementId | null; order: readonly ElementId[] } {
  const list = sceneAt(stepId).structures.find((structure) => structure.id === 'list');
  if (list?.kind !== 'linked-list') throw new Error('no list');
  const order: ElementId[] = [];
  let current = list.head;
  while (current !== null) {
    order.push(current);
    const at: ElementId = current;
    current = list.nodes.find((node) => node.id === at)?.next ?? null;
  }
  return { head: list.head, order };
}

describe('linked lists Lesson', () => {
  it('is registered under foundations', () => {
    expect(lessonContent('foundations', 'linked-lists')).toBe(linkedListsContent);
  });

  it('reduces every Step to a Scene', () => {
    expect(scenes).toHaveLength(10);
  });

  it('lists its Steps in teaching order', () => {
    expect(lesson.steps.map((step) => step.id)).toEqual([
      'the-problem',
      'a-node',
      'linking-nodes',
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
      'explain',
      'explain',
      'explain',
      'explain',
      'explain',
      'explain',
      'explain',
      'explain',
      'explain',
    ]);
  });

  it('places each Check on its Step with its kind', () => {
    expect(
      lesson.steps.flatMap((step) =>
        step.check === undefined ? [] : [[step.id, step.check.id, step.check.kind]],
      ),
    ).toEqual([
      ['linking-nodes', 'which-node-is-last', 'predict'],
      ['traversal', 'where-current-moves', 'predict'],
      ['insert-at-head', 'cost-of-insert-at-head', 'choice'],
      ['insert-after', 'first-link-to-change', 'choice'],
      ['delete-after', 'prev-next-after-deletion', 'predict'],
      ['access-by-index', 'cost-of-reaching-index-k', 'choice'],
    ]);
  });

  it('makes the new node the head after insert-at-head', () => {
    expect(listAt('insert-at-head')).toEqual({
      head: 'node-z',
      order: ['node-z', 'node-a', 'node-b', 'node-c'],
    });
  });

  it('splices the new node after prev in insert-after', () => {
    expect(listAt('insert-after')).toEqual({
      head: 'node-z',
      order: ['node-z', 'node-a', 'node-x', 'node-b', 'node-c'],
    });
  });

  it('relinks past the removed node in delete-after', () => {
    expect(listAt('delete-after')).toEqual({
      head: 'node-z',
      order: ['node-z', 'node-a', 'node-b', 'node-c'],
    });
  });

  it('ends with the prev, current and next Pointers', () => {
    expect(sceneAt('reverse-preview').pointers).toEqual([
      { id: 'prev', label: 'prev', target: null },
      { id: 'current', label: 'current', target: { structureId: 'list', elementId: 'node-z' } },
      { id: 'next', label: 'next', target: { structureId: 'list', elementId: 'node-a' } },
    ]);
  });
});
