import type { CSSProperties, ReactElement } from 'react';
import { MAXIMUM_SCALE, TRANSITION_MILLISECONDS } from './metrics';
import { AnnotationLayer } from './AnnotationLayer';
import { describeScene } from './describe-scene';
import { ElementNode } from './ElementNode';
import { LinkLayer } from './LinkLayer';
import styles from './scene.module.css';
import { sceneItems } from './scene-items';
import { SelectionLayer } from './SelectionLayer';
import { useRetainedElements } from './use-retained-elements';
import type { SceneViewProps } from './scene-view-types';

const motionStyle: CSSProperties & Record<`--${string}`, string> = {
  '--scene-motion': `${String(TRANSITION_MILLISECONDS)}ms`,
};

export function SceneView({ scene, labels, selection }: SceneViewProps): ReactElement {
  const items = sceneItems(scene, labels);
  const { elements, release } = useRetainedElements(scene, items.elements);
  const { width, height } = items.layout;
  const selected = selection?.selected ?? null;
  return (
    <figure className={styles.figure} aria-label={labels.sceneDescription} style={motionStyle}>
      <div
        className={styles.canvas}
        data-canvas="true"
        style={{
          width: '100%',
          maxWidth: width * MAXIMUM_SCALE,
          aspectRatio: `${String(width)} / ${String(height)}`,
        }}
      >
        <svg
          className={styles.drawing}
          aria-hidden="true"
          viewBox={`0 0 ${String(width)} ${String(height)}`}
        >
          {elements.map((item) => (
            <ElementNode
              key={item.key}
              item={item}
              onFaded={release}
              selected={
                selected?.structureId === item.ref.structureId &&
                selected.elementId === item.ref.elementId
              }
            />
          ))}
          <LinkLayer structures={items.layout.structures} />
          <AnnotationLayer items={items} />
        </svg>
        {selection === undefined ? null : (
          <SelectionLayer
            elements={elements}
            layout={items.layout}
            labels={labels}
            selection={selection}
          />
        )}
      </div>
      <ol className={styles.description}>
        {describeScene(scene, items.layout.structures, labels).map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
    </figure>
  );
}
