import { initialCheckState } from '../check';
import type { CheckId, CheckState } from '../check';
import type { LessonSlug, ModuleSlug, StepId } from '../course';
import type { CheckKey, ExerciseProgress, LessonKey, Progress } from './types';

const noExerciseProgress: ExerciseProgress = {
  code: '',
  hintsTaken: 0,
  rejections: 0,
  passed: false,
};

export function lessonKey(module: ModuleSlug, lesson: LessonSlug): LessonKey {
  return `${module}/${lesson}`;
}

export function checkKey(lesson: LessonKey, check: CheckId): CheckKey {
  return `${lesson}/${check}`;
}

export function stepsSeenIn(progress: Progress, lesson: LessonKey): readonly StepId[] {
  return progress.stepsSeen[lesson] ?? [];
}

export function checkStateOf(progress: Progress, key: CheckKey): CheckState {
  return progress.checks[key] ?? initialCheckState;
}

export function exerciseProgressOf(progress: Progress, lesson: LessonKey): ExerciseProgress {
  return progress.exercises[lesson] ?? noExerciseProgress;
}

export function markStepSeen(progress: Progress, lesson: LessonKey, step: StepId): Progress {
  const seen = stepsSeenIn(progress, lesson);
  if (seen.includes(step)) return progress;
  return { ...progress, stepsSeen: { ...progress.stepsSeen, [lesson]: [...seen, step] } };
}

export function setCheckState(progress: Progress, key: CheckKey, state: CheckState): Progress {
  return { ...progress, checks: { ...progress.checks, [key]: state } };
}

function updateExercise(
  progress: Progress,
  lesson: LessonKey,
  change: (current: ExerciseProgress) => ExerciseProgress,
): Progress {
  const next = change(exerciseProgressOf(progress, lesson));
  return { ...progress, exercises: { ...progress.exercises, [lesson]: next } };
}

export function saveExerciseCode(progress: Progress, lesson: LessonKey, code: string): Progress {
  return updateExercise(progress, lesson, (current) => ({ ...current, code }));
}

export function takeHint(progress: Progress, lesson: LessonKey, hintCount: number): Progress {
  if (exerciseProgressOf(progress, lesson).hintsTaken >= hintCount) return progress;
  return updateExercise(progress, lesson, (current) => ({
    ...current,
    hintsTaken: current.hintsTaken + 1,
  }));
}

export function recordSubmit(
  progress: Progress,
  lesson: LessonKey,
  outcome: 'pass' | 'rejection',
): Progress {
  return updateExercise(progress, lesson, (current) =>
    outcome === 'pass'
      ? { ...current, passed: true }
      : { ...current, rejections: current.rejections + 1 },
  );
}
