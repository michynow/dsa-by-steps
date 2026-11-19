import type { ReactElement } from 'react';
import type { ShapedValue } from '@/domain';
import { SceneView } from '@/renderer';
import type { SceneLabels } from '@/renderer';
import styles from './exercise.module.css';
import { listScene } from './value-scene';

export function ValueView({
  value,
  labels,
}: {
  readonly value: ShapedValue;
  readonly labels: SceneLabels;
}): ReactElement {
  if (value.shape === 'linked-list') {
    return (
      <div className={styles.valueScene}>
        <SceneView scene={listScene(value.value)} labels={labels} />
      </div>
    );
  }
  return <code className={styles.valueCode}>{JSON.stringify(value.value)}</code>;
}
