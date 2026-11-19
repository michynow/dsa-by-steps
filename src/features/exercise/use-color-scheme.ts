import { useSyncExternalStore } from 'react';

const query = '(prefers-color-scheme: dark)';

function subscribe(notify: () => void): () => void {
  const media = window.matchMedia(query);
  media.addEventListener('change', notify);
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => {
    media.removeEventListener('change', notify);
    observer.disconnect();
  };
}

function isDark(): boolean {
  const forced = document.documentElement.dataset['theme'];
  return forced === undefined ? window.matchMedia(query).matches : forced === 'dark';
}

export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, isDark);
}
