import {
  arrayOf,
  cell,
  entry,
  listOf,
  mapOf,
  node,
  queueOf,
  ref,
  sceneOf,
  stackOf,
} from '@/test/scene-fixtures';
import { layoutScene } from './layout';

const box = (structureId: string, elementId: string, x: number, y: number, label = elementId) => ({
  ref: ref(structureId, elementId),
  x,
  y,
  width: 64,
  height: 40,
  label,
});

describe('layoutScene', () => {
  it('lays an array out as one row with room for indexes', () => {
    expect(layoutScene(sceneOf([arrayOf('arr', 'a', 'b')]))).toEqual({
      width: 160,
      height: 76,
      structures: [
        {
          id: 'arr',
          kind: 'array',
          x: 8,
          y: 8,
          width: 144,
          height: 60,
          elements: [box('arr', 'a', 8, 8), box('arr', 'b', 88, 8)],
          links: [],
        },
      ],
    });
  });

  it('lays a linked list out in traversal order, then unreachable nodes, with null links', () => {
    const list = listOf('list', 'n1', node('n3'), node('n2'), node('n1', 'n2'));
    expect(layoutScene(sceneOf([list]))).toEqual({
      width: 256,
      height: 116,
      structures: [
        {
          id: 'list',
          kind: 'linked-list',
          x: 8,
          y: 8,
          width: 240,
          height: 100,
          elements: [
            box('list', 'n1', 8, 28),
            box('list', 'n2', 88, 28),
            box('list', 'n3', 168, 28),
          ],
          links: [
            {
              from: ref('list', 'n1'),
              to: ref('list', 'n2'),
              points: [
                { x: 72, y: 48 },
                { x: 88, y: 48 },
              ],
            },
            {
              from: ref('list', 'n2'),
              to: null,
              points: [
                { x: 152, y: 48 },
                { x: 160, y: 48 },
              ],
            },
            {
              from: ref('list', 'n3'),
              to: null,
              points: [
                { x: 232, y: 48 },
                { x: 240, y: 48 },
              ],
            },
          ],
        },
      ],
    });
  });

  it('routes a link that does not go to the next box underneath the row', () => {
    const list = listOf('list', 'a', node('a', 'b'), node('b', 'a'));
    const [structure] = layoutScene(sceneOf([list])).structures;
    expect(structure?.links).toEqual([
      {
        from: ref('list', 'a'),
        to: ref('list', 'b'),
        points: [
          { x: 72, y: 48 },
          { x: 88, y: 48 },
        ],
      },
      {
        from: ref('list', 'b'),
        to: ref('list', 'a'),
        points: [
          { x: 128, y: 68 },
          { x: 128, y: 96 },
          { x: 32, y: 96 },
          { x: 32, y: 68 },
        ],
      },
    ]);
  });

  it('shows a head-less list with its nodes in stored order and no head room', () => {
    const list = listOf('list', null, node('x', 'y'), node('y'));
    const [structure] = layoutScene(sceneOf([list])).structures;
    expect(structure?.elements).toEqual([box('list', 'x', 8, 8), box('list', 'y', 88, 8)]);
  });

  it('puts the top of a stack first', () => {
    expect(layoutScene(sceneOf([stackOf('st', 'a', 'b')]))).toEqual({
      width: 136,
      height: 104,
      structures: [
        {
          id: 'st',
          kind: 'stack',
          x: 8,
          y: 8,
          width: 120,
          height: 88,
          elements: [box('st', 'b', 8, 8), box('st', 'a', 8, 56)],
          links: [],
        },
      ],
    });
  });

  it('lays an empty stack out as a single empty slot', () => {
    expect(layoutScene(sceneOf([stackOf('st')]))).toEqual({
      width: 80,
      height: 56,
      structures: [
        { id: 'st', kind: 'stack', x: 8, y: 8, width: 64, height: 40, elements: [], links: [] },
      ],
    });
  });

  it('lays a queue out as a row with room for the front and back labels', () => {
    expect(layoutScene(sceneOf([queueOf('q', 'a', 'b', 'c')]))).toEqual({
      width: 240,
      height: 76,
      structures: [
        {
          id: 'q',
          kind: 'queue',
          x: 8,
          y: 8,
          width: 224,
          height: 60,
          elements: [box('q', 'a', 8, 28), box('q', 'b', 88, 28), box('q', 'c', 168, 28)],
          links: [],
        },
      ],
    });
  });

  it('lays an empty queue out as a single empty slot', () => {
    expect(layoutScene(sceneOf([queueOf('q')])).structures).toEqual([
      { id: 'q', kind: 'queue', x: 8, y: 8, width: 64, height: 40, elements: [], links: [] },
    ]);
  });

  it('lays a hash map out with one row per bucket, empty buckets included', () => {
    const map = mapOf('map', [], [entry('e1', 'k1', 'v1'), entry('e2', 'k2', 'v2')]);
    const wide = (id: string, x: number, y: number, label: string) => ({
      ref: ref('map', id),
      x,
      y,
      width: 96,
      height: 40,
      label,
    });
    expect(layoutScene(sceneOf([map]))).toEqual({
      width: 256,
      height: 104,
      structures: [
        {
          id: 'map',
          kind: 'hash-map',
          x: 8,
          y: 8,
          width: 240,
          height: 88,
          elements: [wide('e1', 40, 56, 'k1: v1'), wide('e2', 152, 56, 'k2: v2')],
          links: [],
        },
      ],
    });
  });

  it('stacks structures vertically in scene order with a fixed gap', () => {
    const layout = layoutScene(sceneOf([arrayOf('top', 'a'), arrayOf('bottom', 'b')]));
    expect(layout).toEqual({
      width: 80,
      height: 168,
      structures: [
        {
          id: 'top',
          kind: 'array',
          x: 8,
          y: 8,
          width: 64,
          height: 60,
          elements: [box('top', 'a', 8, 8)],
          links: [],
        },
        {
          id: 'bottom',
          kind: 'array',
          x: 8,
          y: 100,
          width: 64,
          height: 60,
          elements: [box('bottom', 'b', 8, 100)],
          links: [],
        },
      ],
    });
  });

  it('makes room above an element for every pointer on it and ignores null pointers', () => {
    const scene = sceneOf(
      [arrayOf('arr', 'a')],
      [
        { id: 'p1', label: 'i', target: ref('arr', 'a') },
        { id: 'p2', label: 'j', target: ref('arr', 'a') },
        { id: 'p3', label: 'k', target: null },
      ],
    );
    expect(layoutScene(scene)).toEqual({
      width: 80,
      height: 116,
      structures: [
        {
          id: 'arr',
          kind: 'array',
          x: 8,
          y: 8,
          width: 64,
          height: 100,
          elements: [box('arr', 'a', 8, 48)],
          links: [],
        },
      ],
    });
  });

  it('gives a pointer room only in the structure that owns its target', () => {
    const scene = sceneOf(
      [arrayOf('one', 'a'), arrayOf('two', 'b')],
      [
        { id: 'p1', label: 'i', target: ref('two', 'b') },
        { id: 'p2', label: 'j', target: ref('one', 'a') },
      ],
    );
    expect(layoutScene(scene).structures.map((s) => s.elements)).toEqual([
      [box('one', 'a', 8, 28)],
      [box('two', 'b', 8, 140)],
    ]);
  });

  it('ignores pointers to elements that do not exist', () => {
    const scene = sceneOf(
      [arrayOf('arr', 'a')],
      [{ id: 'p', label: 'i', target: ref('arr', 'gone') }],
    );
    expect(layoutScene(scene).structures.map((s) => s.elements)).toEqual([[box('arr', 'a', 8, 8)]]);
  });

  it('keeps ids containing dashes and slashes', () => {
    const scene = sceneOf([
      { kind: 'array', id: 'my-array', cells: [cell('cell-1'), cell('a/b')] },
    ]);
    expect(layoutScene(scene).structures[0]?.elements.map((e) => e.ref)).toEqual([
      ref('my-array', 'cell-1'),
      ref('my-array', 'a/b'),
    ]);
  });

  it('labels values that are null, boolean and numeric', () => {
    const scene = sceneOf([
      { kind: 'array', id: 'arr', cells: [cell('a', null), cell('b', true), cell('c', 7)] },
    ]);
    expect(layoutScene(scene).structures[0]?.elements.map((e) => e.label)).toEqual([
      'null',
      'true',
      '7',
    ]);
  });

  it('lays an empty scene out as just padding', () => {
    expect(layoutScene(sceneOf([]))).toEqual({ width: 16, height: 16, structures: [] });
  });
});
