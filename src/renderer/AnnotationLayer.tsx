import type { ReactElement } from 'react';
import { CELL_HEIGHT, MARKER_HEIGHT } from './metrics';
import styles from './scene.module.css';
import { translate } from './translate';
import type { SceneItems } from './scene-items';

export interface AnnotationLayerProps {
  readonly items: SceneItems;
}

export function AnnotationLayer({ items }: AnnotationLayerProps): ReactElement {
  return (
    <g>
      {items.slots.map((slot) => (
        <g key={slot.key}>
          <rect
            className={styles.slot}
            x={slot.x}
            y={slot.y}
            width={slot.width}
            height={CELL_HEIGHT}
          />
          <text
            className={styles.note}
            x={slot.x + slot.width / 2}
            y={slot.y + CELL_HEIGHT / 2}
            textAnchor="middle"
          >
            {slot.text}
          </text>
        </g>
      ))}
      {items.texts.map((text) => (
        <text key={text.key} className={styles.note} x={text.x} y={text.y} textAnchor={text.anchor}>
          {text.text}
        </text>
      ))}
      {items.markers.map((marker) => (
        <g
          key={marker.key}
          className={styles.marker}
          data-marker={marker.key}
          style={{ transform: translate(marker.x, marker.y) }}
        >
          <rect className={styles.markerBox} width={marker.width} height={MARKER_HEIGHT - 2} />
          <text className={styles.markerText} x={marker.width / 2} y={(MARKER_HEIGHT - 2) / 2}>
            {marker.text}
          </text>
        </g>
      ))}
    </g>
  );
}
