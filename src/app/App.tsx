import type { ReactElement } from 'react';
import type { i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider, type createBrowserRouter } from 'react-router';

export interface AppProps {
  readonly i18n: i18n;
  readonly router: ReturnType<typeof createBrowserRouter>;
}

export function App({ i18n, router }: AppProps): ReactElement {
  return (
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={router} />
    </I18nextProvider>
  );
}
