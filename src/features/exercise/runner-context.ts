import { createContext, useContext } from 'react';
import type { ExerciseRunner } from '@/runner';

export const ExerciseRunnerContext = createContext<ExerciseRunner | null>(null);

export function useExerciseRunner(): ExerciseRunner {
  const runner = useContext(ExerciseRunnerContext);
  if (runner === null) throw new Error('ExerciseRunnerProvider is missing');
  return runner;
}
