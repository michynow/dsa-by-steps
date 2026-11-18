import { useId } from 'react';
import type { ReactElement } from 'react';
import type { LinkLine, StructureLayout } from './layout';
import styles from './scene.module.css';

export interface LinkLayerProps {
  readonly structures: readonly StructureLayout[];
}

const pointsOf = (link: LinkLine): string =>
  link.points.map((point) => `${String(point.x)},${String(point.y)}`).join(' ');

export function LinkLayer({ structures }: LinkLayerProps): ReactElement {
  const arrowId = useId();
  return (
    <g>
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
        >
          <path className={styles.arrowHead} d="M0,0 L10,5 L0,10 z" />
        </marker>
      </defs>
      {structures.flatMap((structure) =>
        structure.links.map((link) => (
          <polyline
            key={`${structure.id}/${link.from.elementId}`}
            className={styles.link}
            points={pointsOf(link)}
            markerEnd={link.to === null ? undefined : `url(#${arrowId})`}
          />
        )),
      )}
    </g>
  );
}
