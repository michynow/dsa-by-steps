import type { SceneLabels } from '@/renderer';
import type { LessonPlayerMessages } from './messages';

export function sceneLabelsOf({ stage }: LessonPlayerMessages): SceneLabels {
  return {
    structure: stage.structure,
    tone: stage.tone,
    head: stage.head,
    top: stage.top,
    front: stage.front,
    back: stage.back,
    nullLink: stage.nullLink,
    empty: stage.empty,
    bucket: stage.bucket,
    index: stage.index,
    sceneDescription: stage.figure,
    selectElement: stage.select,
  };
}
