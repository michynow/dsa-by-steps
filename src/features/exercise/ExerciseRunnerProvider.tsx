import type { ReactElement, ReactNode } from 'react';
import type { ExerciseRunner } from '@/runner';
import { ExerciseRunnerContext } from './runner-context';

export function ExerciseRunnerProvider({
  runner,
  children,
}: {
  readonly runner: ExerciseRunner;
  readonly children: ReactNode;
}): ReactElement {
  return <ExerciseRunnerContext value={runner}>{children}</ExerciseRunnerContext>;
}
