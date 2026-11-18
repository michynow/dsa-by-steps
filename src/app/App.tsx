import type { ReactElement } from 'react';
import type { i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider, type createBrowserRouter } from 'react-router';
import { ProgressProvider } from '@/features/progress';
import type { createProgressStore } from '@/features/progress';

export interface AppProps {
  readonly i18n: i18n;
  readonly router: ReturnType<typeof createBrowserRouter>;
  readonly progress: ReturnType<typeof createProgressStore>;
}

export function App({ i18n, router, progress }: AppProps): ReactElement {
  return (
    <I18nextProvider i18n={i18n}>
      <ProgressProvider store={progress}>
        <RouterProvider router={router} />
      </ProgressProvider>
    </I18nextProvider>
  );
}
