import { useLayoutEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import type { SceneLayout } from './layout';
import styles from './scene.module.css';
import type { ElementItem } from './scene-items';
import type { SceneLabels, SceneSelection } from './scene-view-types';

export interface SelectionLayerProps {
  readonly elements: readonly ElementItem[];
  readonly layout: SceneLayout;
  readonly labels: SceneLabels;
  readonly selection: SceneSelection;
}

const percent = (part: number, whole: number): string =>
  `${String(Math.round((part / whole) * 1_000_000) / 10_000)}%`;

function nameOf(item: ElementItem, labels: SceneLabels): string {
  const place = `${labels.structure[item.kind]}, ${labels.index} ${String(item.position)}`;
  return `${labels.selectElement} ${item.label}, ${place}`;
}

export function SelectionLayer({
  elements,
  layout,
  labels,
  selection,
}: SelectionLayerProps): ReactElement {
  const { selected, onSelect } = selection;
  const focusedKey = useRef<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  useLayoutEffect(() => {
    const button =
      focusedKey.current === null ? undefined : buttons.current.get(focusedKey.current);
    if (button !== undefined && document.activeElement === document.body) button.focus();
  });
  return (
    <div className={styles.overlay}>
      {elements
        .filter((item) => !item.leaving)
        .map((item) => (
          <button
            key={item.key}
            type="button"
            className={styles.control}
            ref={(button) => {
              if (button === null) buttons.current.delete(item.key);
              else buttons.current.set(item.key, button);
            }}
            onFocus={() => {
              focusedKey.current = item.key;
            }}
            onBlur={(event) => {
              if (event.relatedTarget !== null) focusedKey.current = null;
            }}
            aria-label={nameOf(item, labels)}
            aria-pressed={
              selected?.structureId === item.ref.structureId &&
              selected.elementId === item.ref.elementId
            }
            style={{
              left: percent(item.x, layout.width),
              top: percent(item.y, layout.height),
              width: percent(item.width, layout.width),
              height: percent(item.height, layout.height),
            }}
            onClick={() => {
              onSelect(item.ref);
            }}
          />
        ))}
    </div>
  );
}
