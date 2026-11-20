import type { ElementRef, HighlightTone, Scene, StructureKind } from '@/domain';
import type { SceneBounds } from './scene-bounds';

export interface SceneLabels {
  readonly structure: Readonly<Record<StructureKind, string>>;
  readonly tone: Readonly<Record<HighlightTone, string>>;
  readonly head: string;
  readonly top: string;
  readonly front: string;
  readonly back: string;
  readonly nullLink: string;
  readonly empty: string;
  readonly bucket: string;
  readonly index: string;
  readonly sceneDescription: string;
  readonly selectElement: string;
}

export interface SceneSelection {
  readonly selected: ElementRef | null;
  readonly onSelect: (ref: ElementRef) => void;
}

export interface SceneViewProps {
  readonly scene: Scene;
  readonly labels: SceneLabels;
  readonly selection?: SceneSelection;
  readonly bounds?: SceneBounds | undefined;
  readonly centeredOn?: SceneBounds | undefined;
}
