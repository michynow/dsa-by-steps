import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { HighlightTone, Scene } from '@/domain';
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
import { SceneView } from './SceneView';
import type { SceneLabels, SceneSelection } from './scene-view-types';

const labels: SceneLabels = {
  structure: {
    array: 'Array',
    'linked-list': 'Linked list',
    stack: 'Stack',
    queue: 'Queue',
    'hash-map': 'Hash map',
  },
  tone: { focus: 'wyróżnione', compare: 'porównanie', done: 'gotowe', error: 'błąd' },
  head: 'head',
  top: 'top',
  front: 'front',
  back: 'back',
  nullLink: 'null',
  empty: 'empty',
  bucket: 'Bucket',
  index: 'Index',
  sceneDescription: 'Scene',
  selectElement: 'Select',
};

const viewOf = (scene: Scene, selection?: SceneSelection) =>
  selection === undefined ? (
    <SceneView scene={scene} labels={labels} />
  ) : (
    <SceneView scene={scene} labels={labels} selection={selection} />
  );

const renderScene = (scene: Scene, selection?: SceneSelection) => render(viewOf(scene, selection));

const descriptionOf = (): readonly (string | null)[] =>
  within(screen.getByRole('figure', { name: 'Scene' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

const byAttribute = (container: HTMLElement, name: string, value: string): Element | null =>
  [...container.querySelectorAll(`[${name}]`)].find((n) => n.getAttribute(name) === value) ?? null;

const elementNode = (container: HTMLElement, structureId: string, elementId: string) =>
  byAttribute(container, 'data-element', JSON.stringify([structureId, elementId]));

const markerNode = (container: HTMLElement, pointerId: string) =>
  byAttribute(container, 'data-marker', JSON.stringify(['pointer', pointerId]));

const drawnTexts = (container: HTMLElement): readonly (string | null)[] =>
  [...container.querySelectorAll('svg text')].map((text) => text.textContent);

const pointer = (id: string, label: string, structureId: string, elementId: string) => ({
  id,
  label,
  target: ref(structureId, elementId),
});

describe('SceneView', () => {
  it('renders the values of every element', () => {
    const scene = sceneOf([arrayOf('arr', 'a', 'b'), mapOf('map', [entry('e', 'key', 'val')])]);
    const { container } = renderScene(scene);
    expect(drawnTexts(container)).toEqual(['a', 'b', 'key: val', '0', '1', '0']);
  });

  it('hides the drawing from assistive technology and names the figure', () => {
    const { container } = renderScene(sceneOf([arrayOf('arr', 'a')]));
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('figure', { name: 'Scene' })).toBeInTheDocument();
  });

  it('describes an array with its pointers and translated highlight tones', () => {
    renderScene(
      sceneOf(
        [arrayOf('arr', 'a', 'b')],
        [pointer('p', 'i', 'arr', 'a')],
        [{ target: ref('arr', 'a'), tone: 'focus' }],
      ),
    );
    expect(descriptionOf()).toEqual(['Array: Index 0: a (i, wyróżnione), Index 1: b']);
  });

  it.each<[HighlightTone, string]>([
    ['focus', 'wyróżnione'],
    ['compare', 'porównanie'],
    ['done', 'gotowe'],
    ['error', 'błąd'],
  ])('describes the %s tone with its label and never its raw id', (tone, word) => {
    renderScene(sceneOf([arrayOf('arr', 'a')], [], [{ target: ref('arr', 'a'), tone }]));
    expect(descriptionOf()).toEqual([`Array: Index 0: a (${word})`]);
  });

  it('describes a linked list in traversal order with its head and null link', () => {
    renderScene(sceneOf([listOf('list', 'a', node('b'), node('a', 'b'))]));
    expect(descriptionOf()).toEqual(['Linked list: a (head), b, null']);
  });

  it('describes a stack from its top', () => {
    renderScene(sceneOf([stackOf('st', 'a', 'b')]));
    expect(descriptionOf()).toEqual(['Stack: b (top), a']);
  });

  it('describes a queue with its front and back', () => {
    renderScene(sceneOf([queueOf('q', 'a', 'b', 'c')]));
    expect(descriptionOf()).toEqual(['Queue: a (front), b, c (back)']);
  });

  it('describes a one-item queue with front and back on the same item', () => {
    renderScene(sceneOf([queueOf('q', 'a')]));
    expect(descriptionOf()).toEqual(['Queue: a (front, back)']);
  });

  it('describes a hash map bucket by bucket', () => {
    renderScene(sceneOf([mapOf('map', [], [entry('e1', 'k1', 'v1'), entry('e2', 'k2', 'v2')])]));
    expect(descriptionOf()).toEqual(['Hash map: Bucket 0: empty; Bucket 1: k1: v1, k2: v2']);
  });

  it('describes and draws a hash map with no buckets as empty', () => {
    const { container } = renderScene(sceneOf([mapOf('map')]));
    expect(descriptionOf()).toEqual(['Hash map: empty']);
    expect(drawnTexts(container)).toEqual(['empty']);
  });

  it('describes empty structures and lists each structure in scene order', () => {
    renderScene(sceneOf([stackOf('st'), queueOf('q'), arrayOf('arr')]));
    expect(descriptionOf()).toEqual(['Stack: empty', 'Queue: empty', 'Array: empty']);
  });

  it('draws the empty note for an empty stack, queue and bucket', () => {
    const { container } = renderScene(
      sceneOf([stackOf('st'), queueOf('q'), mapOf('map', [], [entry('e', 'k', 'v')])]),
    );
    expect(drawnTexts(container)).toEqual(['k: v', 'empty', 'empty', 'empty', '0', '1']);
  });

  it.each<HighlightTone>(['focus', 'compare', 'done', 'error'])(
    'exposes the %s tone of a highlighted element',
    (tone) => {
      const { container } = renderScene(
        sceneOf([arrayOf('arr', 'a', 'b')], [], [{ target: ref('arr', 'a'), tone }]),
      );
      expect(elementNode(container, 'arr', 'a')).toHaveAttribute('data-tone', tone);
      expect(elementNode(container, 'arr', 'b')).not.toHaveAttribute('data-tone');
    },
  );

  it('keeps the same DOM node for an element that moved', () => {
    const { container, rerender } = renderScene(sceneOf([arrayOf('arr', 'a', 'b')]));
    const before = elementNode(container, 'arr', 'a');
    expect(before).toHaveStyle({ transform: 'translate(8px, 8px)' });
    rerender(viewOf(sceneOf([arrayOf('arr', 'b', 'a')])));
    const after = elementNode(container, 'arr', 'a');
    expect(after).toBe(before);
    expect(after).toHaveStyle({ transform: 'translate(88px, 8px)' });
  });

  it('tells apart structure x/y with cell z from structure x with cell y/z', () => {
    const first = (z: string) => ({ kind: 'array' as const, id: 'x/y', cells: [cell(z)] });
    const second = (ids: readonly string[]) => ({
      kind: 'array' as const,
      id: 'x',
      cells: ids.map((id) => cell(id)),
    });
    const { container, rerender } = renderScene(sceneOf([first('z'), second(['y/z'])]));
    const zNode = elementNode(container, 'x/y', 'z');
    const yzNode = elementNode(container, 'x', 'y/z');
    expect(zNode).not.toBe(yzNode);
    expect(yzNode).toHaveStyle({ transform: 'translate(8px, 100px)' });
    rerender(viewOf(sceneOf([first('z'), second(['n', 'y/z'])])));
    expect(elementNode(container, 'x/y', 'z')).toBe(zNode);
    expect(elementNode(container, 'x', 'y/z')).toBe(yzNode);
    expect(zNode).toHaveStyle({ transform: 'translate(8px, 8px)' });
    expect(yzNode).toHaveStyle({ transform: 'translate(88px, 100px)' });
  });

  it('keeps an element leaving until its fade is over', () => {
    vi.useFakeTimers();
    try {
      const { container, rerender } = renderScene(sceneOf([arrayOf('arr', 'a', 'b')]));
      rerender(viewOf(sceneOf([arrayOf('arr', 'a')])));
      expect(elementNode(container, 'arr', 'b')).toHaveAttribute('data-leaving', 'true');
      expect(elementNode(container, 'arr', 'a')).not.toHaveAttribute('data-leaving');
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(elementNode(container, 'arr', 'b')).toBeNull();
      expect(elementNode(container, 'arr', 'a')).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('removes a leaving element when its fade transition ends', () => {
    const { container, rerender } = renderScene(sceneOf([arrayOf('arr', 'a', 'b')]));
    rerender(viewOf(sceneOf([arrayOf('arr', 'a')])));
    const leaving = elementNode(container, 'arr', 'b');
    expect(leaving).not.toBeNull();
    if (leaving !== null) fireEvent.transitionEnd(leaving);
    expect(elementNode(container, 'arr', 'b')).toBeNull();
  });

  it('removes a leaving element within one fade window even if scenes keep changing', () => {
    vi.useFakeTimers();
    try {
      const { container, rerender } = renderScene(sceneOf([arrayOf('arr', 'gone', 'a')]));
      for (let step = 1; step <= 10; step += 1) {
        rerender(viewOf(sceneOf([arrayOf('arr', `c${String(step)}`)])));
        act(() => {
          vi.advanceTimersByTime(100);
        });
      }
      expect(elementNode(container, 'arr', 'gone')).toBeNull();
      expect(elementNode(container, 'arr', 'a')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('removes a leaving element immediately under reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    }));
    try {
      const { container, rerender } = renderScene(sceneOf([arrayOf('arr', 'a', 'b')]));
      rerender(viewOf(sceneOf([arrayOf('arr', 'a')])));
      expect(elementNode(container, 'arr', 'b')).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('stacks two pointers on one element without overlap', () => {
    const { container } = renderScene(
      sceneOf(
        [arrayOf('arr', 'a')],
        [pointer('p1', 'i', 'arr', 'a'), pointer('p2', 'j', 'arr', 'a')],
      ),
    );
    expect(elementNode(container, 'arr', 'a')).toHaveStyle({ transform: 'translate(8px, 48px)' });
    expect(markerNode(container, 'p1')).toHaveStyle({ transform: 'translate(8px, 28px)' });
    expect(markerNode(container, 'p2')).toHaveStyle({ transform: 'translate(8px, 8px)' });
  });

  it('does not draw a pointer whose target is null', () => {
    const { container } = renderScene(
      sceneOf([arrayOf('arr', 'a')], [{ id: 'p', label: 'i', target: null }]),
    );
    expect(container.querySelector('[data-marker]')).toBeNull();
  });

  it('attaches pointers to the Structure that owns the target when ids repeat', () => {
    const { container } = renderScene(
      sceneOf(
        [arrayOf('one', 'a'), arrayOf('two', 'a')],
        [pointer('p1', 'i', 'two', 'a'), pointer('p2', 'j', 'one', 'a')],
      ),
    );
    expect(markerNode(container, 'p1')).toHaveStyle({ transform: 'translate(8px, 120px)' });
    expect(markerNode(container, 'p2')).toHaveStyle({ transform: 'translate(8px, 8px)' });
    expect(elementNode(container, 'two', 'a')).toHaveStyle({ transform: 'translate(8px, 140px)' });
  });

  it('truncates a long pointer label in the drawing and keeps it whole in the description', () => {
    const long = 'p'.repeat(30);
    const { container } = renderScene(
      sceneOf([arrayOf('arr', 'a')], [pointer('p', long, 'arr', 'a')]),
    );
    expect(drawnTexts(container)).toEqual(['a', '0', 'ppppppp…']);
    expect(descriptionOf()).toEqual([`Array: Index 0: a (${long})`]);
  });

  it('accepts element ids with dashes and slashes', () => {
    const scene = sceneOf([
      { kind: 'array', id: 'my-array', cells: [cell('cell-1'), cell('a/b')] },
    ]);
    const { container } = renderScene(scene, { selected: null, onSelect: vi.fn() });
    expect(elementNode(container, 'my-array', 'cell-1')).not.toBeNull();
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Select cell-1, Array, Index 0',
      'Select a/b, Array, Index 1',
    ]);
  });

  it('draws a list without a head using its stored order and describes it', () => {
    const { container } = renderScene(sceneOf([listOf('list', null, node('x', 'y'), node('y'))]));
    expect(elementNode(container, 'list', 'x')).toHaveStyle({ transform: 'translate(8px, 8px)' });
    expect(elementNode(container, 'list', 'y')).toHaveStyle({ transform: 'translate(88px, 8px)' });
    expect(descriptionOf()).toEqual(['Linked list: x, y, null']);
  });

  it('draws a cyclic list once per node and terminates', () => {
    const { container } = renderScene(
      sceneOf([listOf('list', 'a', node('a', 'b'), node('b', 'a'))]),
    );
    expect(drawnTexts(container)).toEqual(['a', 'b', 'head']);
    expect(container.querySelectorAll('[data-element]')).toHaveLength(2);
    expect(descriptionOf()).toEqual(['Linked list: a (head), b']);
  });

  it('shows null, boolean and long values, truncating only the drawing', () => {
    const long = 'x'.repeat(40);
    const scene = sceneOf([
      { kind: 'array', id: 'arr', cells: [cell('a', null), cell('b', false), cell('c', long)] },
    ]);
    const { container } = renderScene(scene);
    expect(drawnTexts(container)).toEqual(['null', 'false', 'xxxxxxx…', '0', '1', '2']);
    expect(descriptionOf()).toEqual([`Array: Index 0: null, Index 1: false, Index 2: ${long}`]);
  });

  it('moves a link with its boxes and keeps its DOM node', () => {
    const link = JSON.stringify(['list', 'a', 'b']);
    const { container, rerender } = renderScene(
      sceneOf([listOf('list', 'a', node('a', 'b'), node('b'))]),
    );
    const before = byAttribute(container, 'data-link', link);
    expect(before).toHaveAttribute('d', 'M72 48 L88 48');
    rerender(viewOf(sceneOf([listOf('list', 'z', node('z', 'a'), node('a', 'b'), node('b'))])));
    const after = byAttribute(container, 'data-link', link);
    expect(after).toBe(before);
    expect(after).toHaveAttribute('d', 'M152 48 L168 48');
  });

  it('scales the drawing down to its container but never above natural size', () => {
    const { container } = renderScene(sceneOf([arrayOf('arr', 'a', 'b')]));
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 160 76');
    expect(byAttribute(container, 'data-canvas', 'true')).toHaveStyle({ maxWidth: '160px' });
  });

  describe('selection', () => {
    const scene = sceneOf([arrayOf('arr', 'a', 'b')]);

    it('makes nothing focusable without selection', () => {
      const { container } = renderScene(scene);
      expect(screen.queryAllByRole('button')).toEqual([]);
      expect(container.querySelectorAll('[tabindex]')).toHaveLength(0);
    });

    it('selects an element with Tab then Enter', async () => {
      const onSelect = vi.fn();
      renderScene(scene, { selected: null, onSelect });
      const user = userEvent.setup();
      await user.tab();
      expect(screen.getByRole('button', { name: 'Select a, Array, Index 0' })).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(onSelect.mock.calls).toEqual([[ref('arr', 'a')]]);
    });

    it('selects an element with Space', async () => {
      const onSelect = vi.fn();
      renderScene(scene, { selected: null, onSelect });
      const user = userEvent.setup();
      await user.tab();
      await user.tab();
      await user.keyboard(' ');
      expect(onSelect.mock.calls).toEqual([[ref('arr', 'b')]]);
    });

    it('selects an element with a click', async () => {
      const onSelect = vi.fn();
      renderScene(scene, { selected: null, onSelect });
      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Select b, Array, Index 1' }));
      expect(onSelect.mock.calls).toEqual([[ref('arr', 'b')]]);
    });

    it('marks only the selected element as pressed', () => {
      renderScene(scene, { selected: ref('arr', 'b'), onSelect: vi.fn() });
      expect(
        screen
          .getAllByRole('button')
          .map((b) => [b.getAttribute('aria-label'), b.getAttribute('aria-pressed')]),
      ).toEqual([
        ['Select a, Array, Index 0', 'false'],
        ['Select b, Array, Index 1', 'true'],
      ]);
    });

    it('does not mix up equal element ids in different structures', () => {
      const twin = sceneOf([arrayOf('one', 'a'), arrayOf('two', 'a')]);
      renderScene(twin, { selected: ref('two', 'a'), onSelect: vi.fn() });
      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
      ]);
    });

    it('gives equal values distinct accessible names', () => {
      renderScene(sceneOf([arrayOf('arr', 'a', 'a')]), { selected: null, onSelect: vi.fn() });
      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        'Select a, Array, Index 0',
        'Select a, Array, Index 1',
      ]);
    });

    it('keeps focus on the focused element when it moves', () => {
      const selection = { selected: null, onSelect: vi.fn() };
      const { rerender } = renderScene(scene, selection);
      const button = screen.getByRole('button', { name: 'Select a, Array, Index 0' });
      act(() => {
        button.focus();
      });
      rerender(viewOf(sceneOf([arrayOf('arr', 'b', 'a')]), selection));
      expect(document.activeElement).toBe(button);
      expect(button).toHaveAttribute('aria-label', 'Select a, Array, Index 1');
    });

    it('positions the controls as percentages of the layout size', () => {
      renderScene(scene, { selected: null, onSelect: vi.fn() });
      expect(
        screen
          .getAllByRole('button')
          .map((b) => [b.style.left, b.style.top, b.style.width, b.style.height]),
      ).toEqual([
        ['5%', '10.5263%', '40%', '52.6316%'],
        ['55%', '10.5263%', '40%', '52.6316%'],
      ]);
    });
  });
});
