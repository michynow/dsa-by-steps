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
import type { SceneBounds } from './scene-bounds';
import type { SceneViewProps } from './scene-view-types';

const motionStyle: CSSProperties & Record<`--${string}`, string> = {
  '--scene-motion': `${String(TRANSITION_MILLISECONDS)}ms`,
};

function frameOf(
  layout: SceneBounds,
  bounds: SceneBounds | undefined,
  centeredOn: SceneBounds | undefined,
): SceneBounds & { readonly viewBox: string } {
  const width = Math.max(layout.width, bounds?.width ?? 0);
  const height = Math.max(layout.height, bounds?.height ?? 0);
  const left = centeredOn === undefined ? 0 : (centeredOn.width - width) / 2;
  const top = centeredOn === undefined ? 0 : (centeredOn.height - height) / 2;
  return {
    width,
    height,
    viewBox: `${String(left)} ${String(top)} ${String(width)} ${String(height)}`,
  };
}

export function SceneView({
  scene,
  labels,
  selection,
  bounds,
  centeredOn,
}: SceneViewProps): ReactElement {
  const items = sceneItems(scene, labels);
  const { elements, release } = useRetainedElements(scene, items.elements);
  const { width, height, viewBox } = frameOf(items.layout, bounds, centeredOn);
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
        <svg className={styles.drawing} aria-hidden="true" viewBox={viewBox}>
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
            layout={{ ...items.layout, width, height }}
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
