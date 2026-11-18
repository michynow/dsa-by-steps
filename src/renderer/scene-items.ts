import type { ElementRef, HighlightTone, Scene, Structure } from '@/domain';
import { toneOf } from './describe-scene';
import { layoutScene, rowTop, markerRoom } from './layout';
import type { SceneLayout, StructureLayout } from './layout';
import { markersAbove } from './markers';
import {
  BUCKET_INDEX_WIDTH,
  CELL_HEIGHT,
  CELL_WIDTH,
  ENTRY_WIDTH,
  INDEX_HEIGHT,
  MARKER_HEIGHT,
  ROW_GAP,
} from './metrics';
import type { SceneLabels } from './scene-view-types';

export interface ElementItem {
  readonly key: string;
  readonly ref: ElementRef;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly tone: HighlightTone | undefined;
  readonly leaving: boolean;
}

export interface MarkerItem {
  readonly key: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

export interface TextItem {
  readonly key: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly anchor: 'start' | 'middle' | 'end';
}

export interface SlotItem {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly text: string;
}

export interface SceneItems {
  readonly layout: SceneLayout;
  readonly elements: readonly ElementItem[];
  readonly markers: readonly MarkerItem[];
  readonly texts: readonly TextItem[];
  readonly slots: readonly SlotItem[];
}

export const elementKey = (ref: ElementRef): string => `${ref.structureId}/${ref.elementId}`;

function elementItems(scene: Scene, layout: StructureLayout): readonly ElementItem[] {
  return layout.elements.map((box) => ({
    key: elementKey(box.ref),
    ref: box.ref,
    label: box.label,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    tone: toneOf(scene, box.ref),
    leaving: false,
  }));
}

function markerItems(
  scene: Scene,
  structure: Structure,
  layout: StructureLayout,
  labels: SceneLabels,
): readonly MarkerItem[] {
  const markers = markersAbove(scene, structure);
  return layout.elements.flatMap((box) =>
    (markers.get(box.ref.elementId) ?? []).map((marker, slot) => ({
      key: marker.key,
      text: marker.kind === 'tag' ? labels[marker.tag] : marker.label,
      x: box.x,
      y: box.y - (slot + 1) * MARKER_HEIGHT,
      width: box.width,
    })),
  );
}

function sequenceTexts(structure: Structure, layout: StructureLayout, labels: SceneLabels) {
  const at = (index: number) => layout.elements[index];
  switch (structure.kind) {
    case 'array':
      return layout.elements.map((box, index) => ({
        key: `index:${structure.id}:${String(index)}`,
        text: String(index),
        x: box.x + box.width / 2,
        y: box.y + box.height + INDEX_HEIGHT / 2,
        anchor: 'middle' as const,
      }));
    case 'stack': {
      const top = at(0);
      return top === undefined
        ? []
        : [
            {
              key: `top:${structure.id}`,
              text: labels.top,
              x: top.x + top.width + ROW_GAP,
              y: top.y + top.height / 2,
              anchor: 'start' as const,
            },
          ];
    }
    case 'linked-list':
      return layout.links.flatMap((link) =>
        link.to === null && link.points[0] !== undefined
          ? [
              {
                key: `null:${structure.id}:${link.from.elementId}`,
                text: labels.nullLink,
                x: link.points[0].x,
                y: link.points[0].y + CELL_HEIGHT / 2 + INDEX_HEIGHT / 2,
                anchor: 'end' as const,
              },
            ]
          : [],
      );
    case 'queue':
    case 'hash-map':
      return [];
  }
}

function bucketTexts(structure: Structure, layout: StructureLayout, room: number) {
  if (structure.kind !== 'hash-map') return [];
  return structure.buckets.map((_, index) => ({
    key: `bucket:${structure.id}:${String(index)}`,
    text: String(index),
    x: layout.x + BUCKET_INDEX_WIDTH / 2,
    y: rowTop(layout.y, room, index) + CELL_HEIGHT / 2,
    anchor: 'middle' as const,
  }));
}

function slotItems(
  structure: Structure,
  layout: StructureLayout,
  room: number,
  labels: SceneLabels,
): readonly SlotItem[] {
  if (structure.kind === 'hash-map') {
    return structure.buckets.flatMap((bucket, index) =>
      bucket.length > 0
        ? []
        : [
            {
              key: `slot:${structure.id}:${String(index)}`,
              x: layout.x + BUCKET_INDEX_WIDTH,
              y: rowTop(layout.y, room, index),
              width: ENTRY_WIDTH,
              text: labels.empty,
            },
          ],
    );
  }
  return layout.elements.length > 0
    ? []
    : [
        {
          key: `slot:${structure.id}`,
          x: layout.x,
          y: layout.y,
          width: CELL_WIDTH,
          text: labels.empty,
        },
      ];
}

export function sceneItems(scene: Scene, labels: SceneLabels): SceneItems {
  const layout = layoutScene(scene);
  const perStructure = scene.structures.flatMap((structure, index) => {
    const placed = layout.structures[index];
    return placed === undefined ? [] : [{ structure, placed }];
  });
  return {
    layout,
    elements: perStructure.flatMap(({ placed }) => elementItems(scene, placed)),
    markers: perStructure.flatMap(({ structure, placed }) =>
      markerItems(scene, structure, placed, labels),
    ),
    texts: perStructure.flatMap(({ structure, placed }) => {
      const room = markerRoom(markersAbove(scene, structure));
      return [...sequenceTexts(structure, placed, labels), ...bucketTexts(structure, placed, room)];
    }),
    slots: perStructure.flatMap(({ structure, placed }) =>
      slotItems(structure, placed, markerRoom(markersAbove(scene, structure)), labels),
    ),
  };
}
