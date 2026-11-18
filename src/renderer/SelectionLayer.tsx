import type { ReactElement } from 'react';
import styles from './scene.module.css';
import { translate } from './translate';
import type { ElementItem } from './scene-items';
import type { SceneLabels, SceneSelection } from './scene-view-types';

export interface SelectionLayerProps {
  readonly elements: readonly ElementItem[];
  readonly labels: SceneLabels;
  readonly selection: SceneSelection;
}

export function SelectionLayer({ elements, labels, selection }: SelectionLayerProps): ReactElement {
  const { selected, onSelect } = selection;
  return (
    <div className={styles.overlay}>
      {elements
        .filter((item) => !item.leaving)
        .map((item) => (
          <button
            key={item.key}
            type="button"
            className={styles.control}
            aria-label={`${labels.selectElement} ${item.label}`}
            aria-pressed={
              selected?.structureId === item.ref.structureId &&
              selected.elementId === item.ref.elementId
            }
            style={{
              width: item.width,
              height: item.height,
              transform: translate(item.x, item.y),
            }}
            onClick={() => {
              onSelect(item.ref);
            }}
          />
        ))}
    </div>
  );
}
