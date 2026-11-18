import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyProgress, lessonKey, markStepSeen, serializeProgress } from '@/domain';
import { createFakeStorage } from '@/test/storage-fakes';
import {
  createBrowserProgressRepository,
  createMemoryProgressRepository,
} from './progress-repository';

const mainKey = 'dsa-by-steps.progress';
const backupKey = 'dsa-by-steps.progress.backup';
const now = '2026-11-18T12:00:00.000Z';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(now));
});

afterEach(() => {
  vi.useRealTimers();
});

function backupOf(...texts: readonly string[]): string {
  return JSON.stringify(texts.map((text) => ({ at: now, text })));
}

const seen = markStepSeen(emptyProgress, lessonKey('arrays', 'binary-search'), 'intro');

describe('createBrowserProgressRepository load', () => {
  it('is fresh when nothing is stored', () => {
    expect(createBrowserProgressRepository(createFakeStorage()).load()).toEqual({ kind: 'fresh' });
  });

  it('restores valid Progress', () => {
    const storage = createFakeStorage({ [mainKey]: serializeProgress(seen) });
    expect(createBrowserProgressRepository(storage).load()).toEqual({
      kind: 'restored',
      progress: seen,
    });
  });

  it.each([
    ['malformed JSON', '{nope', { code: 'malformed', issues: ['not valid JSON'] }],
    [
      'invalid shape',
      '{"version":1}',
      {
        code: 'malformed',
        issues: [
          'stepsSeen: Invalid input: expected record, received undefined',
          'checks: Invalid input: expected record, received undefined',
          'exercises: Invalid input: expected record, received undefined',
        ],
      },
    ],
    ['future version', '{"version":99}', { code: 'unsupported-version', version: 99 }],
  ])('recovers from %s and keeps the raw text as backup', (_name, raw, error) => {
    const storage = createFakeStorage({ [mainKey]: raw });
    expect(createBrowserProgressRepository(storage).load()).toEqual({ kind: 'recovered', error });
    expect(Object.fromEntries(storage.entries)).toEqual({ [backupKey]: backupOf(raw) });
  });

  it('is fresh when storage throws on getItem', () => {
    const storage = createFakeStorage({}, { getItem: new Error('blocked') });
    expect(createBrowserProgressRepository(storage).load()).toEqual({ kind: 'fresh' });
  });

  it('is fresh without storage', () => {
    expect(createBrowserProgressRepository(undefined).load()).toEqual({ kind: 'fresh' });
  });

  it('still recovers when the backup cannot be written', () => {
    const storage = createFakeStorage({ [mainKey]: '{nope' }, { setItem: new Error('quota') });
    expect(createBrowserProgressRepository(storage).load()).toEqual({
      kind: 'recovered',
      error: { code: 'malformed', issues: ['not valid JSON'] },
    });
  });
});

describe('createBrowserProgressRepository save', () => {
  it('writes serialised Progress under the main key', () => {
    const storage = createFakeStorage();
    createBrowserProgressRepository(storage).save(seen);
    expect(Object.fromEntries(storage.entries)).toEqual({ [mainKey]: serializeProgress(seen) });
  });

  it('does not throw when storage throws on setItem', () => {
    const storage = createFakeStorage({}, { setItem: new Error('quota') });
    expect(() => {
      createBrowserProgressRepository(storage).save(seen);
    }).not.toThrow();
  });

  it('does not throw without storage', () => {
    expect(() => {
      createBrowserProgressRepository(undefined).save(seen);
    }).not.toThrow();
  });

  it('after recovery the first save leaves empty Progress in the main key and the corrupt text in the backup', () => {
    const storage = createFakeStorage({ [mainKey]: '{nope' });
    const repository = createBrowserProgressRepository(storage);
    repository.load();
    repository.save(emptyProgress);
    expect(Object.fromEntries(storage.entries)).toEqual({
      [mainKey]: serializeProgress(emptyProgress),
      [backupKey]: backupOf('{nope'),
    });
  });

  it('keeps both corrupt texts when a second recovery meets an existing backup', () => {
    const storage = createFakeStorage({ [mainKey]: '{bad2', [backupKey]: backupOf('{bad1') });
    createBrowserProgressRepository(storage).load();
    expect(Object.fromEntries(storage.entries)).toEqual({
      [backupKey]: backupOf('{bad1', '{bad2'),
    });
  });

  it('wraps an unreadable existing backup as an entry instead of discarding it', () => {
    const storage = createFakeStorage({ [mainKey]: '{bad2', [backupKey]: 'garbage' });
    createBrowserProgressRepository(storage).load();
    expect(Object.fromEntries(storage.entries)).toEqual({
      [backupKey]: backupOf('garbage', '{bad2'),
    });
  });

  it('keeps only the 5 most recent backups', () => {
    const old = backupOf('1', '2', '3', '4', '5');
    const storage = createFakeStorage({ [mainKey]: '6', [backupKey]: old });
    createBrowserProgressRepository(storage).load();
    expect(Object.fromEntries(storage.entries)).toEqual({
      [backupKey]: backupOf('2', '3', '4', '5', '6'),
    });
  });

  it('leaves the main key untouched and refuses to save when the backup cannot be written', () => {
    const storage = createFakeStorage({ [mainKey]: '{bad' });
    const failing = {
      ...storage,
      setItem: (key: string, value: string) => {
        if (key === backupKey) throw new Error('quota');
        storage.setItem(key, value);
      },
    };
    const repository = createBrowserProgressRepository(failing);
    expect(repository.load()).toEqual({
      kind: 'recovered',
      error: { code: 'malformed', issues: ['not valid JSON'] },
    });
    repository.save(seen);
    expect(Object.fromEntries(storage.entries)).toEqual({ [mainKey]: '{bad' });
  });
});

describe('createMemoryProgressRepository', () => {
  it('is fresh without initial Progress', () => {
    expect(createMemoryProgressRepository().load()).toEqual({ kind: 'fresh' });
  });

  it('restores what was saved', () => {
    const repository = createMemoryProgressRepository();
    repository.save(seen);
    expect(repository.load()).toEqual({ kind: 'restored', progress: seen });
  });

  it('restores initial Progress', () => {
    expect(createMemoryProgressRepository(seen).load()).toEqual({
      kind: 'restored',
      progress: seen,
    });
  });
});
