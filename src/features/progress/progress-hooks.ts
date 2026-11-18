import { useStore } from 'zustand';
import type { Progress } from '@/domain';
import { useProgressStore } from './progress-context';
import type { ProgressLoad } from './progress-repository';
import type { ProgressActions } from './progress-store';

export function useProgress<T>(selector: (progress: Progress) => T): T {
  return useStore(useProgressStore(), (state) => selector(state.progress));
}

export function useProgressActions(): ProgressActions {
  return useStore(useProgressStore(), (state) => state.actions);
}

export function useProgressLoad(): ProgressLoad {
  return useStore(useProgressStore(), (state) => state.load);
}
