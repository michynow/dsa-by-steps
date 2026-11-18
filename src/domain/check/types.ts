import type { ElementId, ElementRef, StructureId } from '../scene';

export type CheckId = string;
export type OptionId = string;

export type Check =
  | {
      readonly kind: 'predict';
      readonly id: CheckId;
      readonly correct: ElementRef;
    }
  | {
      readonly kind: 'choice';
      readonly id: CheckId;
      readonly options: readonly OptionId[];
      readonly correct: OptionId;
    }
  | {
      readonly kind: 'order';
      readonly id: CheckId;
      readonly structureId: StructureId;
      readonly correct: readonly ElementId[];
    };

export type Answer =
  | { readonly kind: 'predict'; readonly target: ElementRef }
  | { readonly kind: 'choice'; readonly option: OptionId }
  | { readonly kind: 'order'; readonly sequence: readonly ElementId[] };

export type Verdict = 'correct' | 'miss';

export type CheckStatus = 'open' | 'passed' | 'revealed';

export interface CheckState {
  readonly misses: number;
  readonly status: CheckStatus;
}

export const initialCheckState: CheckState = { misses: 0, status: 'open' };

export const missesBeforeReveal = 3;

export type CheckError =
  | { readonly code: 'answer-kind-mismatch' }
  | { readonly code: 'reveal-unavailable'; readonly misses: number }
  | { readonly code: 'already-settled'; readonly status: CheckStatus };
