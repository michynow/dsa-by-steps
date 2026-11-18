import type { ElementId, ElementRef, Highlight, Scene, Structure } from '@/domain';
import type { ElementBox, StructureLayout } from './layout';
import { markersAbove } from './markers';
import type { MarkerMap } from './markers';
import type { SceneLabels } from './scene-view-types';

interface Context {
  readonly scene: Scene;
  readonly structure: Structure;
  readonly layout: StructureLayout;
  readonly labels: SceneLabels;
  readonly markers: MarkerMap;
}

const sameRef = (a: ElementRef, b: ElementRef): boolean =>
  a.structureId === b.structureId && a.elementId === b.elementId;

export function toneOf(scene: Scene, target: ElementRef): Highlight['tone'] | undefined {
  return scene.highlights.findLast((highlight) => sameRef(highlight.target, target))?.tone;
}

function isTop(structure: Structure, elementId: ElementId): boolean {
  return structure.kind === 'stack' && structure.items.at(-1)?.id === elementId;
}

function notesOf(context: Context, box: ElementBox): readonly string[] {
  const { scene, structure, labels, markers } = context;
  const marked = (markers.get(box.ref.elementId) ?? []).map((marker) =>
    marker.kind === 'tag' ? labels[marker.tag] : marker.label,
  );
  const tone = toneOf(scene, box.ref);
  return [
    ...(isTop(structure, box.ref.elementId) ? [labels.top] : []),
    ...marked,
    ...(tone === undefined ? [] : [labels.tone[tone]]),
  ];
}

function describeElement(context: Context, box: ElementBox, position: number): string {
  const notes = notesOf(context, box);
  const prefix =
    context.structure.kind === 'array' ? `${context.labels.index} ${String(position)}: ` : '';
  return `${prefix}${box.label}${notes.length === 0 ? '' : ` (${notes.join(', ')})`}`;
}

function endsInNull(layout: StructureLayout, box: ElementBox): boolean {
  return layout.links.some((link) => link.to === null && sameRef(link.from, box.ref));
}

function describeSequence(context: Context): readonly string[] {
  return context.layout.elements.flatMap((box, position) => [
    describeElement(context, box, position),
    ...(endsInNull(context.layout, box) ? [context.labels.nullLink] : []),
  ]);
}

function describeBuckets(context: Context, structure: Extract<Structure, { kind: 'hash-map' }>) {
  const byId = new Map(context.layout.elements.map((box) => [box.ref.elementId, box]));
  if (structure.buckets.length === 0) return context.labels.empty;
  const buckets = structure.buckets.map((bucket, index) => {
    const entries = bucket.flatMap((entry) => {
      const box = byId.get(entry.id);
      return box === undefined ? [] : [describeElement(context, box, index)];
    });
    return `${context.labels.bucket} ${String(index)}: ${entries.length === 0 ? context.labels.empty : entries.join(', ')}`;
  });
  return buckets.join('; ');
}

function describeStructure(context: Context): string {
  const { structure, labels } = context;
  const name = labels.structure[structure.kind];
  if (structure.kind === 'hash-map') return `${name}: ${describeBuckets(context, structure)}`;
  const parts = describeSequence(context);
  return `${name}: ${parts.length === 0 ? labels.empty : parts.join(', ')}`;
}

export function describeScene(
  scene: Scene,
  layouts: readonly StructureLayout[],
  labels: SceneLabels,
): readonly string[] {
  return scene.structures.flatMap((structure, index) => {
    const layout = layouts[index];
    if (layout === undefined) return [];
    return [
      describeStructure({
        scene,
        structure,
        layout,
        labels,
        markers: markersAbove(scene, structure),
      }),
    ];
  });
}
