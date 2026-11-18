import { describe, expect, it } from 'vitest';
import { initialCheckState } from '../check';
import { emptyProgress } from './types';
import {
  checkKey,
  checkStateOf,
  exerciseProgressOf,
  lessonKey,
  markStepSeen,
  recordSubmit,
  saveExerciseCode,
  setCheckState,
  stepsSeenIn,
  takeHint,
} from './transitions';

const lesson = lessonKey('arrays', 'binary-search');
const other = lessonKey('arrays', 'two-pointers');

describe('keys', () => {
  it('lessonKey joins module and lesson with a slash', () => {
    expect(lesson).toBe('arrays/binary-search');
  });
  it('checkKey appends the check to the lesson key', () => {
    expect(checkKey(lesson, 'mid')).toBe('arrays/binary-search/mid');
  });
});

describe('stepsSeenIn', () => {
  it('is empty when absent', () => {
    expect(stepsSeenIn(emptyProgress, lesson)).toEqual([]);
  });
  it('returns the recorded steps', () => {
    expect(stepsSeenIn(markStepSeen(emptyProgress, lesson, 's1'), lesson)).toEqual(['s1']);
  });
});

describe('checkStateOf', () => {
  const key = checkKey(lesson, 'mid');
  it('is initialCheckState when absent', () => {
    expect(checkStateOf(emptyProgress, key)).toBe(initialCheckState);
  });
  it('returns the stored state', () => {
    const state = { misses: 2, status: 'revealed' } as const;
    expect(checkStateOf(setCheckState(emptyProgress, key, state), key)).toEqual(state);
  });
});

describe('exerciseProgressOf', () => {
  it('has empty code, 0 Hints, 0 Rejections and not passed when absent', () => {
    expect(exerciseProgressOf(emptyProgress, lesson)).toEqual({
      code: '',
      hintsTaken: 0,
      rejections: 0,
      passed: false,
    });
  });
});

describe('markStepSeen', () => {
  it('is idempotent and returns the same Progress', () => {
    const once = markStepSeen(emptyProgress, lesson, 's1');
    expect(markStepSeen(once, lesson, 's1')).toBe(once);
  });
  it('preserves first-seen order', () => {
    const progress = ['s2', 's1', 's2'].reduce((p, s) => markStepSeen(p, lesson, s), emptyProgress);
    expect(stepsSeenIn(progress, lesson)).toEqual(['s2', 's1']);
  });
  it('does not mutate input and keeps untouched branches', () => {
    const base = markStepSeen(emptyProgress, other, 'a');
    const next = markStepSeen(base, lesson, 's1');
    expect(base.stepsSeen[lesson]).toBeUndefined();
    expect(next.stepsSeen[other]).toBe(base.stepsSeen[other]);
    expect(next.checks).toBe(base.checks);
    expect(next.exercises).toBe(base.exercises);
  });
});

describe('setCheckState', () => {
  it('replaces the state without mutating input', () => {
    const key = checkKey(lesson, 'mid');
    const next = setCheckState(emptyProgress, key, { misses: 1, status: 'open' });
    expect(emptyProgress.checks).toEqual({});
    expect(next.stepsSeen).toBe(emptyProgress.stepsSeen);
    expect(next.checks[key]).toEqual({ misses: 1, status: 'open' });
  });
});

describe('saveExerciseCode', () => {
  it('stores code and keeps other exercise fields', () => {
    const withHint = takeHint(emptyProgress, lesson, 3);
    const next = saveExerciseCode(withHint, lesson, 'let x');
    expect(exerciseProgressOf(next, lesson)).toEqual({
      code: 'let x',
      hintsTaken: 1,
      rejections: 0,
      passed: false,
    });
  });
  it('keeps other lessons by identity', () => {
    const base = saveExerciseCode(emptyProgress, other, 'a');
    const next = saveExerciseCode(base, lesson, 'b');
    expect(next.exercises[other]).toBe(base.exercises[other]);
  });
});

describe('takeHint', () => {
  it('increases hintsTaken by one', () => {
    expect(exerciseProgressOf(takeHint(emptyProgress, lesson, 3), lesson).hintsTaken).toBe(1);
  });
  it('never goes above hintCount', () => {
    const progress = [1, 2, 3, 4].reduce((p) => takeHint(p, lesson, 2), emptyProgress);
    expect(exerciseProgressOf(progress, lesson).hintsTaken).toBe(2);
  });
  it('takes nothing when there are no Hints', () => {
    expect(exerciseProgressOf(takeHint(emptyProgress, lesson, 0), lesson).hintsTaken).toBe(0);
  });
});

describe('recordSubmit', () => {
  it('rejection increments rejections', () => {
    const progress = [1, 2].reduce((p) => recordSubmit(p, lesson, 'rejection'), emptyProgress);
    expect(exerciseProgressOf(progress, lesson)).toMatchObject({ rejections: 2, passed: false });
  });
  it('pass sets passed', () => {
    expect(exerciseProgressOf(recordSubmit(emptyProgress, lesson, 'pass'), lesson).passed).toBe(
      true,
    );
  });
  it('passed never reverts after a later rejection', () => {
    const passed = recordSubmit(emptyProgress, lesson, 'pass');
    const later = recordSubmit(passed, lesson, 'rejection');
    expect(exerciseProgressOf(later, lesson)).toMatchObject({ passed: true, rejections: 1 });
  });
});
