import type { ReactElement } from 'react';
import type { Scene } from '@/domain';
import { SceneView } from '@/renderer';
import type { SceneBounds, SceneSelection } from '@/renderer';
import type { LessonPlayerMessages } from './messages';
import { sceneLabelsOf } from './scene-labels';
import styles from './Stage.module.css';
import { useStepPlayback } from './use-step-playback';
import { Button } from '@/ui';

export interface StageProps {
  readonly frames: readonly Scene[];
  readonly messages: LessonPlayerMessages;
  readonly selection: SceneSelection | undefined;
  readonly turn: boolean;
  readonly stepId: string;
  readonly lessonKey: string;
  readonly bounds?: SceneBounds | undefined;
}

export function Stage({
  frames,
  messages,
  selection,
  turn,
  stepId,
  lessonKey,
  bounds,
}: StageProps): ReactElement {
  const labels = sceneLabelsOf(messages);
  const { scene, playing, replay, toggle } = useStepPlayback(
    frames,
    `${lessonKey}/${stepId}:${String(turn)}`,
  );
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
        <SceneView scene={scene} labels={labels} bounds={bounds} />
      ) : (
        <SceneView scene={scene} labels={labels} selection={selection} bounds={bounds} />
      )}
      <div role="group" aria-label={messages.playback.controls} className={styles.controls}>
        <Button onClick={replay}>{messages.playback.replay}</Button>
        <Button onClick={toggle}>
          {playing ? messages.playback.pause : messages.playback.play}
        </Button>
      </div>
    </div>
  );
}
