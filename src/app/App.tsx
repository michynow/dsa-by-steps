import type { ReactElement } from 'react';
import type { i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider, type createBrowserRouter } from 'react-router';
import { ExerciseRunnerProvider } from '@/features/exercise';
import { ProgressProvider } from '@/features/progress';
import type { createProgressStore } from '@/features/progress';
import { createWorkerExerciseRunner } from '@/runner';
import type { ExerciseRunner } from '@/runner';

export interface AppProps {
  readonly i18n: i18n;
  readonly router: ReturnType<typeof createBrowserRouter>;
  readonly progress: ReturnType<typeof createProgressStore>;
  readonly runner?: ExerciseRunner;
}

export function App({
  i18n,
  router,
  progress,
  runner = createWorkerExerciseRunner(),
}: AppProps): ReactElement {
  return (
    <I18nextProvider i18n={i18n}>
      <ProgressProvider store={progress}>
        <ExerciseRunnerProvider runner={runner}>
          <RouterProvider router={router} />
        </ExerciseRunnerProvider>
      </ProgressProvider>
    </I18nextProvider>
  );
}
