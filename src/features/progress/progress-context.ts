import { createContext, useContext } from 'react';
import type { ProgressStore } from './progress-store';

export const ProgressContext = createContext<ProgressStore | undefined>(undefined);

export function useProgressStore(): ProgressStore {
  const store = useContext(ProgressContext);
  if (store === undefined) {
    throw new Error('Progress hooks must be used inside ProgressProvider');
  }
  return store;
}
