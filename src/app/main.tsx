import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { modules } from '@/content';
import {
  createI18n,
  createLocalePreferenceStore,
  localeFromLanguageTags,
  localeFromPath,
} from '@/features/locale';
import { createBrowserProgressRepository, createProgressStore } from '@/features/progress';
import '@/ui';
import { App } from './App';
import { createRoutes } from './routes';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root container');

const initialLocale =
  localeFromPath(window.location.pathname) ??
  createLocalePreferenceStore(window.localStorage).read() ??
  localeFromLanguageTags(navigator.languages);

createRoot(container).render(
  <StrictMode>
    <App
      i18n={createI18n(initialLocale)}
      router={createBrowserRouter(createRoutes({ modules }))}
      progress={createProgressStore(createBrowserProgressRepository(window.localStorage))}
    />
  </StrictMode>,
);
