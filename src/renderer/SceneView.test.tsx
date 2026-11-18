import { act, render, screen, within } from '@testing-library/react';
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
import type { SceneLabels, SceneSelection } from './SceneView';

const labels: SceneLabels = {
  structure: {
    array: 'Array',
    'linked-list': 'Linked list',
    stack: 'Stack',
    queue: 'Queue',
    'hash-map': 'Hash map',
  },
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

const renderScene = (scene: Scene, selection?: SceneSelection) =>
  render(
    selection === undefined ? (
      <SceneView scene={scene} labels={labels} />
    ) : (
      <SceneView scene={scene} labels={labels} selection={selection} />
    ),
  );

const descriptionOf = (): readonly (string | null)[] =>
  within(screen.getByRole('figure', { name: 'Scene' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent);

const elementNode = (container: HTMLElement, key: string): Element | null =>
  container.querySelector(`[data-element="${key}"]`);

describe('SceneView', () => {
  it('renders the values of every element', () => {
    const scene = sceneOf([arrayOf('arr', 'a', 'b'), mapOf('map', [entry('e', 'key', 'val')])]);
    const { container } = renderScene(scene);
    expect([...container.querySelectorAll('svg text')].map((text) => text.textContent)).toEqual([
      'a',
      'b',
      'key: val',
      '0',
      '1',
      '0',
    ]);
  });

  it('hides the drawing from assistive technology and names the figure', () => {
    const { container } = renderScene(sceneOf([arrayOf('arr', 'a')]));
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('figure', { name: 'Scene' })).toBeInTheDocument();
  });

  it('describes an array with its pointers and highlights', () => {
    renderScene(
      sceneOf(
        [arrayOf('arr', 'a', 'b')],
        [{ id: 'p', label: 'i', target: ref('arr', 'a') }],
        [{ target: ref('arr', 'a'), tone: 'focus' }],
      ),
    );
    expect(descriptionOf()).toEqual(['Array: Index 0: a (i, focus), Index 1: b']);
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

  it('describes empty structures and lists each structure in scene order', () => {
    renderScene(sceneOf([stackOf('st'), queueOf('q'), arrayOf('arr')]));
    expect(descriptionOf()).toEqual(['Stack: empty', 'Queue: empty', 'Array: empty']);
  });

  it.each<HighlightTone>(['focus', 'compare', 'done', 'error'])(
    'exposes the %s tone of a highlighted element',
    (tone) => {
      const { container } = renderScene(
        sceneOf([arrayOf('arr', 'a', 'b')], [], [{ target: ref('arr', 'a'), tone }]),
      );
      expect(elementNode(container, 'arr/a')).toHaveAttribute('data-tone', tone);
      expect(elementNode(container, 'arr/b')).not.toHaveAttribute('data-tone');
    },
  );

  it('keeps the same DOM node for an element that moved', () => {
    const { container, rerender } = renderScene(sceneOf([arrayOf('arr', 'a', 'b')]));
    const before = elementNode(container, 'arr/a');
    expect(before).toHaveStyle({ transform: 'translate(8px, 8px)' });
    rerender(<SceneView scene={sceneOf([arrayOf('arr', 'b', 'a')])} labels={labels} />);
    const after = elementNode(container, 'arr/a');
    expect(after).toBe(before);
    expect(after).toHaveStyle({ transform: 'translate(88px, 8px)' });
  });

  it('keeps an element leaving until its fade is over', () => {
    vi.useFakeTimers();
    const { container, rerender } = renderScene(sceneOf([arrayOf('arr', 'a', 'b')]));
    rerender(<SceneView scene={sceneOf([arrayOf('arr', 'a')])} labels={labels} />);
    expect(elementNode(container, 'arr/b')).toHaveAttribute('data-leaving', 'true');
    expect(elementNode(container, 'arr/a')).not.toHaveAttribute('data-leaving');
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(elementNode(container, 'arr/b')).toBeNull();
    expect(elementNode(container, 'arr/a')).not.toBeNull();
    vi.useRealTimers();
  });

  it('stacks two pointers on one element without overlap', () => {
    const { container } = renderScene(
      sceneOf(
        [arrayOf('arr', 'a')],
        [
          { id: 'p1', label: 'i', target: ref('arr', 'a') },
          { id: 'p2', label: 'j', target: ref('arr', 'a') },
        ],
      ),
    );
    expect(elementNode(container, 'arr/a')).toHaveStyle({ transform: 'translate(8px, 48px)' });
    expect(container.querySelector('[data-marker="pointer:p1"]')).toHaveStyle({
      transform: 'translate(8px, 28px)',
    });
    expect(container.querySelector('[data-marker="pointer:p2"]')).toHaveStyle({
      transform: 'translate(8px, 8px)',
    });
  });

  it('does not draw a pointer whose target is null', () => {
    const { container } = renderScene(
      sceneOf([arrayOf('arr', 'a')], [{ id: 'p', label: 'i', target: null }]),
    );
    expect(container.querySelector('[data-marker]')).toBeNull();
  });

  it('draws pointers on elements of different structures', () => {
    const { container } = renderScene(
      sceneOf(
        [arrayOf('one', 'a'), arrayOf('two', 'b')],
        [
          { id: 'p1', label: 'i', target: ref('two', 'b') },
          { id: 'p2', label: 'j', target: ref('one', 'a') },
        ],
      ),
    );
    expect(container.querySelector('[data-marker="pointer:p1"]')).toHaveStyle({
      transform: 'translate(8px, 120px)',
    });
    expect(container.querySelector('[data-marker="pointer:p2"]')).toHaveStyle({
      transform: 'translate(8px, 8px)',
    });
  });

  it('accepts element ids with dashes and slashes', () => {
    const scene = sceneOf([
      { kind: 'array', id: 'my-array', cells: [cell('cell-1'), cell('a/b')] },
    ]);
    const { container } = renderScene(scene, { selected: null, onSelect: vi.fn() });
    expect(elementNode(container, 'my-array/cell-1')).not.toBeNull();
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Select cell-1',
      'Select a/b',
    ]);
  });

  it('draws a list without a head using its stored order and describes it', () => {
    const { container } = renderScene(sceneOf([listOf('list', null, node('x', 'y'), node('y'))]));
    expect(elementNode(container, 'list/x')).toHaveStyle({ transform: 'translate(8px, 8px)' });
    expect(elementNode(container, 'list/y')).toHaveStyle({ transform: 'translate(88px, 8px)' });
    expect(descriptionOf()).toEqual(['Linked list: x, y, null']);
  });

  it('shows null, boolean and long values, truncating only the drawing', () => {
    const long = 'x'.repeat(40);
    const scene = sceneOf([
      {
        kind: 'array',
        id: 'arr',
        cells: [cell('a', null), cell('b', false), cell('c', long)],
      },
    ]);
    const { container } = renderScene(scene);
    expect(
      [...container.querySelectorAll('svg text')]
        .map((text) => text.textContent)
        .filter((text) => !/^\d$/.test(text)),
    ).toEqual(['null', 'false', 'xxxxxxx…']);
    expect(descriptionOf()).toEqual([`Array: Index 0: null, Index 1: false, Index 2: ${long}`]);
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
      expect(screen.getByRole('button', { name: 'Select a' })).toHaveFocus();
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
      await userEvent.setup().click(screen.getByRole('button', { name: 'Select b' }));
      expect(onSelect.mock.calls).toEqual([[ref('arr', 'b')]]);
    });

    it('marks only the selected element as pressed', () => {
      renderScene(scene, { selected: ref('arr', 'b'), onSelect: vi.fn() });
      expect(
        screen
          .getAllByRole('button')
          .map((b) => [b.getAttribute('aria-label'), b.getAttribute('aria-pressed')]),
      ).toEqual([
        ['Select a', 'false'],
        ['Select b', 'true'],
      ]);
    });

    it('does not mix up equal element ids in different structures', () => {
      const onSelect = vi.fn();
      const twin = sceneOf([arrayOf('one', 'a'), arrayOf('two', 'a')]);
      renderScene(twin, { selected: ref('two', 'a'), onSelect });
      expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'false',
        'true',
      ]);
    });
  });
});
