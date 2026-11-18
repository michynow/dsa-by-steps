import type {
  ElementId,
  ElementRef,
  Primitive,
  Scene,
  Structure,
  StructureId,
  StructureKind,
} from '@/domain';
import { markersAbove, tallestStack } from './markers';
import type { MarkerMap } from './markers';
import {
  BUCKET_INDEX_WIDTH,
  CELL_HEIGHT,
  CELL_WIDTH,
  ENTRY_WIDTH,
  GAP,
  INDEX_HEIGHT,
  LIST_FOOT,
  MARKER_HEIGHT,
  PADDING,
  ROUTE_DEPTH,
  ROUTE_INSET,
  ROW_GAP,
  STRUCTURE_GAP,
  STUB_LENGTH,
  TOP_LABEL_WIDTH,
} from './metrics';

export interface ElementBox {
  readonly ref: ElementRef;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface LinkLine {
  readonly from: ElementRef;
  readonly to: ElementRef | null;
  readonly points: readonly Point[];
}

export interface StructureLayout {
  readonly id: StructureId;
  readonly kind: StructureKind;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly elements: readonly ElementBox[];
  readonly links: readonly LinkLine[];
}

export interface SceneLayout {
  readonly width: number;
  readonly height: number;
  readonly structures: readonly StructureLayout[];
}

interface Arranged {
  readonly width: number;
  readonly height: number;
  readonly elements: readonly ElementBox[];
  readonly links: readonly LinkLine[];
}

interface Item {
  readonly id: ElementId;
  readonly label: string;
}

interface Slot {
  readonly structureId: StructureId;
  readonly x: number;
  readonly y: number;
  readonly width: number;
}

const labelOf = (value: Primitive): string => String(value);

export function markerRoom(markers: MarkerMap): number {
  return tallestStack(markers) * MARKER_HEIGHT;
}

export function rowTop(structureY: number, room: number, index: number): number {
  return structureY + room + index * (room + CELL_HEIGHT + ROW_GAP);
}

function boxOf(item: Item, slot: Slot): ElementBox {
  return {
    ref: { structureId: slot.structureId, elementId: item.id },
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: CELL_HEIGHT,
    label: item.label,
  };
}

function rowWidth(count: number, cellWidth: number): number {
  return count === 0 ? cellWidth : count * cellWidth + (count - 1) * GAP;
}

function arrangeRow(
  structure: Structure,
  items: readonly Item[],
  room: number,
  y: number,
  x: number,
): readonly ElementBox[] {
  return items.map((item, index) =>
    boxOf(item, {
      structureId: structure.id,
      x: x + index * (CELL_WIDTH + GAP),
      y: y + room,
      width: CELL_WIDTH,
    }),
  );
}

function arrangeColumn(
  structure: Structure,
  items: readonly Item[],
  room: number,
  y: number,
  x: number,
): Arranged {
  const count = items.length;
  const elements = items.map((item, index) =>
    boxOf(item, { structureId: structure.id, x, y: rowTop(y, room, index), width: CELL_WIDTH }),
  );
  const pitch = room + CELL_HEIGHT + ROW_GAP;
  return {
    width: count === 0 ? CELL_WIDTH : CELL_WIDTH + TOP_LABEL_WIDTH,
    height: count === 0 ? CELL_HEIGHT : count * pitch - ROW_GAP,
    elements,
    links: [],
  };
}

function arrangeSequence(
  structure: Extract<Structure, { kind: 'array' | 'queue' }>,
  room: number,
  y: number,
  x: number,
): Arranged {
  const items = (structure.kind === 'array' ? structure.cells : structure.items).map((c) => ({
    id: c.id,
    label: labelOf(c.value),
  }));
  const foot = structure.kind === 'array' && items.length > 0 ? INDEX_HEIGHT : 0;
  return {
    width: rowWidth(items.length, CELL_WIDTH),
    height: items.length === 0 ? CELL_HEIGHT : room + CELL_HEIGHT + foot,
    elements: arrangeRow(structure, items, room, y, x),
    links: [],
  };
}

function traversalOrder(structure: Extract<Structure, { kind: 'linked-list' }>) {
  const byId = new Map(structure.nodes.map((n) => [n.id, n]));
  const ordered: (typeof structure.nodes)[number][] = [];
  const seen = new Set<ElementId>();
  let cursor = structure.head === null ? undefined : byId.get(structure.head);
  while (cursor !== undefined && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    ordered.push(cursor);
    cursor = cursor.next === null ? undefined : byId.get(cursor.next);
  }
  return [...ordered, ...structure.nodes.filter((n) => !seen.has(n.id))];
}

function linkBetween(from: ElementBox, to: ElementBox | undefined, adjacent: boolean): LinkLine {
  const midY = from.y + from.height / 2;
  const right = from.x + from.width;
  if (to === undefined) {
    return {
      from: from.ref,
      to: null,
      points: [
        { x: right, y: midY },
        { x: right + STUB_LENGTH, y: midY },
      ],
    };
  }
  if (adjacent) {
    return {
      from: from.ref,
      to: to.ref,
      points: [
        { x: right, y: midY },
        { x: to.x, y: midY },
      ],
    };
  }
  const bottom = from.y + from.height;
  const startX = from.x + from.width / 2 + ROUTE_INSET;
  const endX = to.x + to.width / 2 - ROUTE_INSET;
  return {
    from: from.ref,
    to: to.ref,
    points: [
      { x: startX, y: bottom },
      { x: startX, y: bottom + ROUTE_DEPTH },
      { x: endX, y: bottom + ROUTE_DEPTH },
      { x: endX, y: bottom },
    ],
  };
}

function arrangeList(
  structure: Extract<Structure, { kind: 'linked-list' }>,
  room: number,
  y: number,
  x: number,
): Arranged {
  const nodes = traversalOrder(structure);
  const items = nodes.map((n) => ({ id: n.id, label: labelOf(n.value) }));
  const elements = arrangeRow(structure, items, room, y, x);
  const indexOf = new Map(nodes.map((n, index) => [n.id, index]));
  const links = elements.map((from, index) => {
    const next = nodes[index]?.next ?? null;
    const target = next === null ? undefined : indexOf.get(next);
    return linkBetween(
      from,
      target === undefined ? undefined : elements[target],
      target === index + 1,
    );
  });
  return {
    width: nodes.length === 0 ? CELL_WIDTH : rowWidth(nodes.length, CELL_WIDTH) + GAP,
    height: nodes.length === 0 ? CELL_HEIGHT : room + CELL_HEIGHT + LIST_FOOT,
    elements,
    links,
  };
}

function arrangeMap(
  structure: Extract<Structure, { kind: 'hash-map' }>,
  room: number,
  y: number,
  x: number,
): Arranged {
  const elements = structure.buckets.flatMap((bucket, row) =>
    bucket.map((entry, column) =>
      boxOf(
        { id: entry.id, label: `${labelOf(entry.key)}: ${labelOf(entry.value)}` },
        {
          structureId: structure.id,
          x: x + BUCKET_INDEX_WIDTH + column * (ENTRY_WIDTH + GAP),
          y: rowTop(y, room, row),
          width: ENTRY_WIDTH,
        },
      ),
    ),
  );
  const widest = Math.max(1, ...structure.buckets.map((bucket) => bucket.length));
  const rows = structure.buckets.length;
  return {
    width: BUCKET_INDEX_WIDTH + rowWidth(widest, ENTRY_WIDTH),
    height: rows === 0 ? CELL_HEIGHT : rows * (room + CELL_HEIGHT + ROW_GAP) - ROW_GAP,
    elements,
    links: [],
  };
}

function arrange(structure: Structure, room: number, y: number): Arranged {
  const x = PADDING;
  switch (structure.kind) {
    case 'array':
    case 'queue':
      return arrangeSequence(structure, room, y, x);
    case 'linked-list':
      return arrangeList(structure, room, y, x);
    case 'stack':
      return arrangeColumn(
        structure,
        [...structure.items].reverse().map((c) => ({ id: c.id, label: labelOf(c.value) })),
        room,
        y,
        x,
      );
    case 'hash-map':
      return arrangeMap(structure, room, y, x);
  }
}

export function layoutScene(scene: Scene): SceneLayout {
  let cursor = PADDING;
  const structures = scene.structures.map((structure): StructureLayout => {
    const room = markerRoom(markersAbove(scene, structure));
    const arranged = arrange(structure, room, cursor);
    const layout = { id: structure.id, kind: structure.kind, x: PADDING, y: cursor, ...arranged };
    cursor += arranged.height + STRUCTURE_GAP;
    return layout;
  });
  const last = structures[structures.length - 1];
  return {
    width: PADDING * 2 + Math.max(0, ...structures.map((s) => s.width)),
    height: last === undefined ? PADDING * 2 : last.y + last.height + PADDING,
    structures,
  };
}
