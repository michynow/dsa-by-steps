import type { ReactElement } from 'react';
import { AnnotationLayer } from './AnnotationLayer';
import { describeScene } from './describe-scene';
import { ElementNode } from './ElementNode';
import { LinkLayer } from './LinkLayer';
import styles from './scene.module.css';
import { sceneItems } from './scene-items';
import { SelectionLayer } from './SelectionLayer';
import { useRetainedElements } from './use-retained-elements';
import type { SceneViewProps } from './scene-view-types';

export type { SceneLabels, SceneSelection, SceneViewProps } from './scene-view-types';

export function SceneView({ scene, labels, selection }: SceneViewProps): ReactElement {
  const items = sceneItems(scene, labels);
  const elements = useRetainedElements(scene, items.elements);
  const { width, height } = items.layout;
  const selected = selection?.selected ?? null;
  return (
    <figure className={styles.figure} aria-label={labels.sceneDescription}>
      <svg
        className={styles.drawing}
        aria-hidden="true"
        width={width}
        height={height}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
      >
        <LinkLayer structures={items.layout.structures} />
        {elements.map((item) => (
          <ElementNode
            key={item.key}
            item={item}
            selected={
              selected?.structureId === item.ref.structureId &&
              selected.elementId === item.ref.elementId
            }
          />
        ))}
        <AnnotationLayer items={items} />
      </svg>
      {selection === undefined ? null : (
        <SelectionLayer elements={elements} labels={labels} selection={selection} />
      )}
      <ol className={styles.description}>
        {describeScene(scene, items.layout.structures, labels).map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
    </figure>
  );
}
