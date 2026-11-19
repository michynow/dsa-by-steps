import type { ReactElement } from 'react';
import type { Scene } from '@/domain';
import { SceneView } from '@/renderer';
import type { SceneSelection } from '@/renderer';
import type { LessonPlayerMessages } from './messages';
import { sceneLabelsOf } from './scene-labels';
import styles from './Stage.module.css';

export interface StageProps {
  readonly scene: Scene;
  readonly messages: LessonPlayerMessages;
  readonly selection: SceneSelection | undefined;
  readonly turn: boolean;
  readonly stepId: string;
}

export function Stage({ scene, messages, selection, turn, stepId }: StageProps): ReactElement {
  const labels = sceneLabelsOf(messages);
  return (
    <div className={styles.stage} data-stage="true" data-turn={turn}>
      <div aria-live="polite">
        {turn ? (
          <p key={stepId} className={styles.banner}>
            {messages.stage.turn}
          </p>
        ) : null}
      </div>
      {selection === undefined ? (
        <SceneView scene={scene} labels={labels} />
      ) : (
        <SceneView scene={scene} labels={labels} selection={selection} />
      )}
    </div>
  );
}
