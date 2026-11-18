import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import {
  emptyProgress,
  markStepSeen,
  recordSubmit,
  saveExerciseCode,
  setCheckState,
  takeHint,
} from '@/domain';
import type { CheckKey, CheckState, LessonKey, Progress, StepId } from '@/domain';
import type { ProgressLoad, ProgressRepository } from './progress-repository';

export interface ProgressActions {
  markStepSeen(lesson: LessonKey, step: StepId): void;
  setCheckState(key: CheckKey, state: CheckState): void;
  saveExerciseCode(lesson: LessonKey, code: string): void;
  takeHint(lesson: LessonKey, hintCount: number): void;
  recordSubmit(lesson: LessonKey, outcome: 'pass' | 'rejection'): void;
  replace(progress: Progress): void;
}

export interface ProgressState {
  readonly progress: Progress;
  readonly load: ProgressLoad;
}

export type ProgressStore = StoreApi<ProgressState & { readonly actions: ProgressActions }>;

function progressOf(load: ProgressLoad): Progress {
  return load.kind === 'restored' ? load.progress : emptyProgress;
}

export function createProgressStore(repository: ProgressRepository): ProgressStore {
  const load = repository.load();
  return createStore((set, get) => {
    const apply = (transition: (current: Progress) => Progress): void => {
      const current = get().progress;
      const next = transition(current);
      if (next === current) return;
      set({ progress: next });
      repository.save(next);
    };
    return {
      progress: progressOf(load),
      load,
      actions: {
        markStepSeen: (lesson, step) => {
          apply((p) => markStepSeen(p, lesson, step));
        },
        setCheckState: (key, state) => {
          apply((p) => setCheckState(p, key, state));
        },
        saveExerciseCode: (lesson, code) => {
          apply((p) => saveExerciseCode(p, lesson, code));
        },
        takeHint: (lesson, hintCount) => {
          apply((p) => takeHint(p, lesson, hintCount));
        },
        recordSubmit: (lesson, outcome) => {
          apply((p) => recordSubmit(p, lesson, outcome));
        },
        replace: (progress) => {
          apply(() => progress);
        },
      },
    };
  });
}
