import type { CheckId, CheckState } from '../check';
import type { LessonSlug, ModuleSlug, StepId } from '../course';

export type LessonKey = `${ModuleSlug}/${LessonSlug}`;
export type CheckKey = `${LessonKey}/${CheckId}`;

export interface ExerciseProgress {
  readonly code: string;
  readonly hintsTaken: number;
  readonly rejections: number;
  readonly passed: boolean;
}

export interface ProgressV1 {
  readonly version: 1;
  readonly stepsSeen: Readonly<Record<LessonKey, readonly StepId[]>>;
  readonly checks: Readonly<Record<CheckKey, CheckState>>;
  readonly exercises: Readonly<Record<LessonKey, ExerciseProgress>>;
}

export type Progress = ProgressV1;

export const currentProgressVersion = 1;

export const emptyProgress: Progress = {
  version: currentProgressVersion,
  stepsSeen: {},
  checks: {},
  exercises: {},
};

export type ProgressError =
  | { readonly code: 'malformed'; readonly issues: readonly string[] }
  | { readonly code: 'unsupported-version'; readonly version: unknown };
