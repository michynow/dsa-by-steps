import { useId } from 'react';
import type { ReactElement } from 'react';
import { keyOf } from './keys';
import type { LinkLine } from './layout';
import type { StructureLayout } from './layout';
import styles from './scene.module.css';

export interface LinkLayerProps {
  readonly structures: readonly StructureLayout[];
}

const pathOf = (link: LinkLine): string =>
  link.points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${String(point.x)} ${String(point.y)}`)
    .join(' ');

const linkKey = (structure: StructureLayout, link: LinkLine): string =>
  keyOf(structure.id, link.from.elementId, link.to?.elementId ?? '');

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
        structure.links.map((link) => {
          const d = pathOf(link);
          return (
            <path
              key={linkKey(structure, link)}
              className={styles.link}
              data-link={linkKey(structure, link)}
              d={d}
              pathLength={1}
              style={{ d: `path("${d}")` }}
              markerEnd={link.to === null ? undefined : `url(#${arrowId})`}
            />
          );
        }),
      )}
    </g>
  );
}
