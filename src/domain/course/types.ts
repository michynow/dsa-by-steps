import type { Check } from '../check';
import type { Scene, StepEvent } from '../scene';

export type StepId = string;
export type OutcomeId = string;
export type LessonSlug = string;
export type ModuleSlug = string;

export type StepKind = 'problem' | 'explain';

export interface Step {
  readonly id: StepId;
  readonly kind: StepKind;
  readonly events: readonly StepEvent[];
  readonly check?: Check;
}

export interface Lesson {
  readonly slug: LessonSlug;
  readonly outcomes: readonly OutcomeId[];
  readonly initialScene: Scene;
  readonly steps: readonly Step[];
}

export interface Module {
  readonly slug: ModuleSlug;
  readonly lessons: readonly Lesson[];
}

export interface Course {
  readonly modules: readonly Module[];
}

export interface CoursePosition {
  readonly module: ModuleSlug;
  readonly lesson: LessonSlug;
  readonly step: number;
}

export type CourseError =
  | { readonly code: 'unknown-module'; readonly module: ModuleSlug }
  | { readonly code: 'unknown-lesson'; readonly lesson: LessonSlug }
  | { readonly code: 'step-out-of-range'; readonly step: number };
