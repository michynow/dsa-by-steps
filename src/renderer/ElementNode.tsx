import type { ReactElement } from 'react';
import styles from './scene.module.css';
import { translate } from './translate';
import type { ElementItem } from './scene-items';
import { truncateToWidth } from './truncate';

export interface ElementNodeProps {
  readonly item: ElementItem;
  readonly selected: boolean;
}

export function ElementNode({ item, selected }: ElementNodeProps): ReactElement {
  return (
    <g
      className={styles.element}
      data-element={item.key}
      data-tone={item.tone}
      data-leaving={item.leaving ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
      style={{ transform: translate(item.x, item.y) }}
    >
      <rect className={styles.box} width={item.width} height={item.height} />
      <text className={styles.value} x={item.width / 2} y={item.height / 2}>
        {truncateToWidth(item.label, item.width)}
      </text>
    </g>
  );
}
