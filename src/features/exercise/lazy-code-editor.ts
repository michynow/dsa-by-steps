import { lazy } from 'react';

export const LazyCodeEditor = lazy(async () => {
  const { CodeEditor } = await import('./CodeEditor');
  return { default: CodeEditor };
});
