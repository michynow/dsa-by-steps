import { z } from 'zod';
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

const maxBackups = 5;

const backupEntriesSchema = z.array(z.object({ at: z.string(), text: z.string() }));

interface BackupEntry {
  readonly at: string;
  readonly text: string;
}

function existingBackups(storage: Storage, at: string): readonly BackupEntry[] {
  const raw = storage.getItem(backupKey);
  if (raw === null) return [];
  try {
    const parsed = backupEntriesSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    return [{ at, text: raw }];
  }
  return [{ at, text: raw }];
}

function appendBackup(storage: Storage, text: string): boolean {
  try {
    const at = new Date().toISOString();
    const entries = [...existingBackups(storage, at), { at, text }].slice(-maxBackups);
    storage.setItem(backupKey, JSON.stringify(entries));
    storage.removeItem(storageKey);
    return true;
  } catch {
    return false;
  }
}

export function createBrowserProgressRepository(storage: Storage | undefined): ProgressRepository {
  let writable = true;
  const loadFrom = (target: Storage): ProgressLoad => {
    const raw = target.getItem(storageKey);
    if (raw === null) return { kind: 'fresh' };
    const parsed = parseProgressJson(raw);
    if (parsed.ok) return { kind: 'restored', progress: parsed.value };
    writable = appendBackup(target, raw);
    return { kind: 'recovered', error: parsed.error };
  };
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
      if (!writable) return;
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
