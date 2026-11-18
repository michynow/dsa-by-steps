import { describe, expect, it, vi } from 'vitest';
import {
  checkKey,
  emptyProgress,
  lessonKey,
  markStepSeen,
  recordSubmit,
  saveExerciseCode,
  serializeProgress,
  setCheckState,
  takeHint,
} from '@/domain';
import type { Progress } from '@/domain';
import { createFakeStorage } from '@/test/storage-fakes';
import {
  createBrowserProgressRepository,
  createMemoryProgressRepository,
} from './progress-repository';
import type { ProgressRepository } from './progress-repository';
import { createProgressStore } from './progress-store';
import type { ProgressActions } from './progress-store';

const lesson = lessonKey('arrays', 'binary-search');
const check = checkKey(lesson, 'mid');
const missed = { misses: 1, status: 'open' } as const;

function spiedRepository(initial?: Progress): ProgressRepository & {
  readonly save: ReturnType<typeof vi.fn>;
} {
  const inner = createMemoryProgressRepository(initial);
  return {
    load: () => inner.load(),
    save: vi.fn((progress: Progress) => {
      inner.save(progress);
    }),
  };
}

describe('createProgressStore', () => {
  it('starts from emptyProgress on a fresh load', () => {
    const state = createProgressStore(createMemoryProgressRepository()).getState();
    expect(state.progress).toEqual(emptyProgress);
    expect(state.load).toEqual({ kind: 'fresh' });
  });

  it('starts from restored Progress', () => {
    const restored = markStepSeen(emptyProgress, lesson, 'intro');
    const state = createProgressStore(createMemoryProgressRepository(restored)).getState();
    expect(state.progress).toEqual(restored);
    expect(state.load).toEqual({ kind: 'restored', progress: restored });
  });

  it('starts from emptyProgress after a recovered load', () => {
    const storage = createFakeStorage({ 'dsa-by-steps.progress': '{nope' });
    const state = createProgressStore(createBrowserProgressRepository(storage)).getState();
    expect(state.progress).toEqual(emptyProgress);
    expect(state.load).toEqual({
      kind: 'recovered',
      error: { code: 'malformed', issues: ['not valid JSON'] },
    });
  });

  it.each([
    [
      'markStepSeen',
      (actions: ProgressActions) => {
        actions.markStepSeen(lesson, 'intro');
      },
      markStepSeen(emptyProgress, lesson, 'intro'),
    ],
    [
      'setCheckState',
      (actions: ProgressActions) => {
        actions.setCheckState(check, missed);
      },
      setCheckState(emptyProgress, check, missed),
    ],
    [
      'saveExerciseCode',
      (actions: ProgressActions) => {
        actions.saveExerciseCode(lesson, 'code');
      },
      saveExerciseCode(emptyProgress, lesson, 'code'),
    ],
    [
      'takeHint',
      (actions: ProgressActions) => {
        actions.takeHint(lesson, 2);
      },
      takeHint(emptyProgress, lesson, 2),
    ],
    [
      'recordSubmit pass',
      (actions: ProgressActions) => {
        actions.recordSubmit(lesson, 'pass');
      },
      recordSubmit(emptyProgress, lesson, 'pass'),
    ],
    [
      'recordSubmit rejection',
      (actions: ProgressActions) => {
        actions.recordSubmit(lesson, 'rejection');
      },
      recordSubmit(emptyProgress, lesson, 'rejection'),
    ],
  ])('%s applies its transition and saves once', (_name, act, expected) => {
    const repository = spiedRepository();
    const store = createProgressStore(repository);
    act(store.getState().actions);
    expect(store.getState().progress).toEqual(expected);
    expect(repository.save.mock.calls).toEqual([[expected]]);
  });

  it.each([
    [
      'markStepSeen twice',
      (actions: ProgressActions) => {
        actions.markStepSeen(lesson, 'intro');
      },
    ],
    [
      'takeHint past the hint count',
      (actions: ProgressActions) => {
        actions.takeHint(lesson, 0);
      },
    ],
  ])('%s does not save', (_name, act) => {
    const initial = markStepSeen(emptyProgress, lesson, 'intro');
    const repository = spiedRepository(initial);
    const store = createProgressStore(repository);
    act(store.getState().actions);
    expect(store.getState().progress).toBe(initial);
    expect(repository.save.mock.calls).toEqual([]);
  });

  it('replace swaps the Progress and saves it', () => {
    const imported = markStepSeen(emptyProgress, lesson, 'imported');
    const repository = spiedRepository();
    const store = createProgressStore(repository);
    store.getState().actions.replace(imported);
    expect(store.getState().progress).toEqual(imported);
    expect(repository.save.mock.calls).toEqual([[imported]]);
  });

  it('replace persists an imported Progress in browser storage', () => {
    const imported = markStepSeen(emptyProgress, lesson, 'imported');
    const storage = createFakeStorage();
    createProgressStore(createBrowserProgressRepository(storage))
      .getState()
      .actions.replace(imported);
    expect(storage.entries.get('dsa-by-steps.progress')).toBe(serializeProgress(imported));
  });

  it('keeps in-memory Progress updated when storage rejects the save', () => {
    const storage = createFakeStorage({}, { setItem: new Error('QuotaExceededError') });
    const store = createProgressStore(createBrowserProgressRepository(storage));
    store.getState().actions.markStepSeen(lesson, 'intro');
    expect(store.getState().progress).toEqual(markStepSeen(emptyProgress, lesson, 'intro'));
  });
});
