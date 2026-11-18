import { describe, expect, it } from 'vitest';
import { err, ok } from '../result';
import { canReveal, recordVerdict, reveal } from './check-state';
import { initialCheckState } from './types';
import type { CheckState } from './types';

const open = (misses: number): CheckState => ({ misses, status: 'open' });

describe('recordVerdict', () => {
  it('moves an open state to passed on a correct Verdict, keeping Misses', () => {
    expect(recordVerdict(open(1), 'correct')).toEqual(ok({ misses: 1, status: 'passed' }));
  });

  it('adds one Miss and stays open on a miss Verdict', () => {
    expect(recordVerdict(open(1), 'miss')).toEqual(ok({ misses: 2, status: 'open' }));
  });

  it.each(['passed', 'revealed'] as const)('returns already-settled for a %s state', (status) => {
    const state: CheckState = { misses: 3, status };
    expect(recordVerdict(state, 'miss')).toEqual(err({ code: 'already-settled', status }));
    expect(recordVerdict(state, 'correct')).toEqual(err({ code: 'already-settled', status }));
  });

  it('does not mutate the input state', () => {
    const state = open(1);
    recordVerdict(state, 'miss');
    expect(state).toEqual(open(1));
  });
});

describe('canReveal', () => {
  it('is false at exactly 2 Misses', () => {
    expect(canReveal(open(2))).toBe(false);
  });

  it('is true at exactly 3 Misses', () => {
    expect(canReveal(open(3))).toBe(true);
  });

  it('is false once passed or revealed even with enough Misses', () => {
    expect(canReveal({ misses: 3, status: 'passed' })).toBe(false);
    expect(canReveal({ misses: 3, status: 'revealed' })).toBe(false);
  });
});

describe('reveal', () => {
  it('reveals an open state at exactly 3 Misses, keeping Misses', () => {
    expect(reveal(open(3))).toEqual(ok({ misses: 3, status: 'revealed' }));
  });

  it('returns reveal-unavailable with the current Misses at exactly 2 Misses', () => {
    expect(reveal(open(2))).toEqual(err({ code: 'reveal-unavailable', misses: 2 }));
  });

  it.each(['passed', 'revealed'] as const)('returns already-settled for a %s state', (status) => {
    expect(reveal({ misses: 3, status })).toEqual(err({ code: 'already-settled', status }));
  });

  it('does not mutate the input state', () => {
    const state = open(3);
    reveal(state);
    expect(state).toEqual(open(3));
  });
});

describe('Check walk-through', () => {
  it('reaches Reveal after three Misses and then rejects further Verdicts', () => {
    let state = initialCheckState;
    for (let i = 0; i < 3; i += 1) {
      expect(canReveal(state)).toBe(false);
      const next = recordVerdict(state, 'miss');
      if (!next.ok) throw new Error('expected ok');
      state = next.value;
    }
    expect(canReveal(state)).toBe(true);
    const revealed = reveal(state);
    expect(revealed).toEqual(ok({ misses: 3, status: 'revealed' }));
    if (!revealed.ok) throw new Error('expected ok');
    expect(recordVerdict(revealed.value, 'correct')).toEqual(
      err({ code: 'already-settled', status: 'revealed' }),
    );
  });
});
