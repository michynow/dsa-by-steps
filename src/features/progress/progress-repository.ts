import { parseProgressJson, serializeProgress } from '@/domain';
import type { Progress, ProgressError } from '@/domain';

const storageKey = 'dsa-by-steps.progress';
const backupKey = 'dsa-by-steps.progress.backup';

export type ProgressLoad =
  | { readonly kind: 'fresh' }
  | { readonly kind: 'restored'; readonly progress: Progress }
  | { readonly kind: 'recovered'; readonly error: ProgressError };

export interface ProgressRepository {
  load(): ProgressLoad;
  save(progress: Progress): void;
}

function moveToBackup(storage: Storage, raw: string): void {
  try {
    storage.setItem(backupKey, raw);
    storage.removeItem(storageKey);
  } catch {
    return;
  }
}

function loadFrom(storage: Storage): ProgressLoad {
  const raw = storage.getItem(storageKey);
  if (raw === null) return { kind: 'fresh' };
  const parsed = parseProgressJson(raw);
  if (parsed.ok) return { kind: 'restored', progress: parsed.value };
  moveToBackup(storage, raw);
  return { kind: 'recovered', error: parsed.error };
}

export function createBrowserProgressRepository(storage: Storage | undefined): ProgressRepository {
  return {
    load() {
      if (storage === undefined) return { kind: 'fresh' };
      try {
        return loadFrom(storage);
      } catch {
        return { kind: 'fresh' };
      }
    },
    save(progress) {
      try {
        storage?.setItem(storageKey, serializeProgress(progress));
      } catch {
        return;
      }
    },
  };
}

export function createMemoryProgressRepository(initial?: Progress): ProgressRepository {
  let stored = initial;
  return {
    load: () => (stored === undefined ? { kind: 'fresh' } : { kind: 'restored', progress: stored }),
    save(progress) {
      stored = progress;
    },
  };
}
