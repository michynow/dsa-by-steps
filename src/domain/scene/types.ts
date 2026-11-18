export type StructureId = string;
export type ElementId = string;
export type PointerId = string;
export type Primitive = string | number | boolean | null;

export interface ElementRef {
  readonly structureId: StructureId;
  readonly elementId: ElementId;
}

export interface Cell {
  readonly id: ElementId;
  readonly value: Primitive;
}

export interface ListNode {
  readonly id: ElementId;
  readonly value: Primitive;
  readonly next: ElementId | null;
}

export interface Entry {
  readonly id: ElementId;
  readonly key: Primitive;
  readonly value: Primitive;
}

export type Structure =
  | {
      readonly kind: 'array';
      readonly id: StructureId;
      readonly cells: readonly Cell[];
    }
  | {
      readonly kind: 'linked-list';
      readonly id: StructureId;
      readonly nodes: readonly ListNode[];
      readonly head: ElementId | null;
    }
  | {
      readonly kind: 'stack';
      readonly id: StructureId;
      readonly items: readonly Cell[];
    }
  | {
      readonly kind: 'queue';
      readonly id: StructureId;
      readonly items: readonly Cell[];
    }
  | {
      readonly kind: 'hash-map';
      readonly id: StructureId;
      readonly buckets: readonly (readonly Entry[])[];
    };

export type StructureKind = Structure['kind'];

export interface Pointer {
  readonly id: PointerId;
  readonly label: string;
  readonly target: ElementRef | null;
}

export type HighlightTone = 'focus' | 'compare' | 'done' | 'error';

export interface Highlight {
  readonly target: ElementRef;
  readonly tone: HighlightTone;
}

export interface Scene {
  readonly structures: readonly Structure[];
  readonly pointers: readonly Pointer[];
  readonly highlights: readonly Highlight[];
}

export const emptyScene: Scene = {
  structures: [],
  pointers: [],
  highlights: [],
};

export type StepEvent =
  | { readonly type: 'create'; readonly structure: Structure }
  | { readonly type: 'remove'; readonly structureId: StructureId }
  | {
      readonly type: 'set-value';
      readonly target: ElementRef;
      readonly value: Primitive;
    }
  | {
      readonly type: 'swap';
      readonly structureId: StructureId;
      readonly a: ElementId;
      readonly b: ElementId;
    }
  | {
      readonly type: 'insert-cell';
      readonly structureId: StructureId;
      readonly index: number;
      readonly cell: Cell;
    }
  | { readonly type: 'remove-cell'; readonly target: ElementRef }
  | {
      readonly type: 'add-node';
      readonly structureId: StructureId;
      readonly node: ListNode;
    }
  | { readonly type: 'remove-node'; readonly target: ElementRef }
  | {
      readonly type: 'link';
      readonly structureId: StructureId;
      readonly from: ElementId;
      readonly to: ElementId | null;
    }
  | {
      readonly type: 'set-head';
      readonly structureId: StructureId;
      readonly head: ElementId | null;
    }
  | {
      readonly type: 'push';
      readonly structureId: StructureId;
      readonly cell: Cell;
    }
  | { readonly type: 'pop'; readonly structureId: StructureId }
  | {
      readonly type: 'enqueue';
      readonly structureId: StructureId;
      readonly cell: Cell;
    }
  | { readonly type: 'dequeue'; readonly structureId: StructureId }
  | {
      readonly type: 'put-entry';
      readonly structureId: StructureId;
      readonly bucket: number;
      readonly entry: Entry;
    }
  | { readonly type: 'remove-entry'; readonly target: ElementRef }
  | { readonly type: 'point'; readonly pointer: Pointer }
  | {
      readonly type: 'move-pointer';
      readonly pointerId: PointerId;
      readonly target: ElementRef | null;
    }
  | { readonly type: 'drop-pointer'; readonly pointerId: PointerId }
  | { readonly type: 'highlight'; readonly highlight: Highlight }
  | { readonly type: 'clear-highlights' };

export type StepEventType = StepEvent['type'];

export type SceneError =
  | {
      readonly code: 'unknown-structure';
      readonly event: StepEvent;
      readonly structureId: StructureId;
    }
  | {
      readonly code: 'unknown-element';
      readonly event: StepEvent;
      readonly elementId: ElementId;
    }
  | {
      readonly code: 'unknown-pointer';
      readonly event: StepEvent;
      readonly pointerId: PointerId;
    }
  | {
      readonly code: 'duplicate-id';
      readonly event: StepEvent;
      readonly id: string;
    }
  | {
      readonly code: 'wrong-kind';
      readonly event: StepEvent;
      readonly structureId: StructureId;
      readonly actual: StructureKind;
    }
  | {
      readonly code: 'empty-structure';
      readonly event: StepEvent;
      readonly structureId: StructureId;
    }
  | {
      readonly code: 'index-out-of-range';
      readonly event: StepEvent;
      readonly index: number;
    }
  | {
      readonly code: 'cycle';
      readonly event: StepEvent;
      readonly structureId: StructureId;
    };
